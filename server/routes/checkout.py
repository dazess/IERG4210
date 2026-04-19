import os
import secrets
from datetime import datetime
from flask import Blueprint, request, jsonify, session, current_app
import stripe
from database import get_db
from utils import generate_order_digest, validate_order_digest

bp = Blueprint('checkout', __name__, url_prefix='/api/checkout')

# Initialize Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
MERCHANT_EMAIL = os.environ.get('MERCHANT_EMAIL')
API_BASE_URL = os.environ.get('API_BASE_URL', 'http://localhost:5173')


def auth_required(f):
    """Decorator to require authentication"""
    def wrapper(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper


@bp.route('/create-session', methods=['POST'])
@auth_required
def create_checkout_session():
    """
    Create a Stripe checkout session with order validation and digest generation.
    
    Expected JSON body:
    {
        "items": [{"pid": 1, "quantity": 2}, {"pid": 3, "quantity": 1}]
    }
    """
    try:
        if not stripe.api_key:
            return jsonify({'error': 'Server payment configuration missing STRIPE_SECRET_KEY'}), 500
        if not MERCHANT_EMAIL:
            return jsonify({'error': 'Server payment configuration missing MERCHANT_EMAIL'}), 500

        data = request.get_json()
        if not data or 'items' not in data:
            return jsonify({'error': 'Missing items in request'}), 400
        
        items = data['items']
        if not isinstance(items, list) or len(items) == 0:
            return jsonify({'error': 'Items must be a non-empty array'}), 400
        
        db = get_db()
        user_id = session.get('user_id')
        
        # Fetch user email
        user = db.execute('SELECT email FROM users WHERE userid = ?', (user_id,)).fetchone()
        if not user:
            return jsonify({'error': 'User not found'}), 401
        
        # Validate and fetch product details
        order_items = []
        total_amount = 0
        stripe_line_items = []
        
        for item in items:
            try:
                pid = int(item.get('pid'))
                quantity = int(item.get('quantity'))
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid pid or quantity'}), 400
            
            if quantity <= 0:
                return jsonify({'error': f'Quantity must be positive for product {pid}'}), 400
            
            # Fetch product from DB to get current price
            product = db.execute(
                'SELECT pid, name, price FROM products WHERE pid = ?',
                (pid,)
            ).fetchone()
            
            if not product:
                return jsonify({'error': f'Product {pid} not found'}), 404
            
            price = float(product['price'])
            subtotal = price * quantity
            total_amount += subtotal
            
            order_items.append({
                'pid': pid,
                'quantity': quantity,
                'price_at_purchase': price,
                'name': product['name']
            })
            
            # Add to Stripe line items
            stripe_line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': product['name'],
                    },
                    'unit_amount_decimal': f'{price * 100:.0f}',
                },
                'quantity': quantity,
            })
        
        # Generate salt and digest for order integrity
        salt = secrets.token_hex(16)
        order_digest = generate_order_digest(
            currency='USD',
            merchant_email=MERCHANT_EMAIL,
            salt=salt,
            order_items=order_items,
            total_amount=total_amount,
            secret_key=stripe.api_key
        )
        
        # Insert order into database with status='pending'
        db.execute(
            '''INSERT INTO orders 
               (user_id, order_digest, total_amount, currency, status, salt, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
            (user_id, order_digest, total_amount, 'USD', 'pending', salt, datetime.now(), datetime.now())
        )
        db.commit()
        
        order_id = db.execute(
            'SELECT last_insert_rowid() as id'
        ).fetchone()['id']
        
        # Insert order items
        for item in order_items:
            db.execute(
                '''INSERT INTO order_items (order_id, pid, quantity, price_at_purchase)
                   VALUES (?, ?, ?, ?)''',
                (order_id, item['pid'], item['quantity'], item['price_at_purchase'])
            )
        db.commit()
        
        # Create Stripe Checkout Session
        session_response = stripe.checkout.Session.create(
            payment_method_types=['card'],
            mode='payment',
            customer_email=user['email'],
            line_items=stripe_line_items,
            success_url=f'{API_BASE_URL}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{API_BASE_URL}/',
            metadata={
                'order_id': str(order_id),
                'order_digest': order_digest,
            }
        )
        
        # Update orders table with stripe_session_id
        db.execute(
            'UPDATE orders SET stripe_session_id = ? WHERE order_id = ?',
            (session_response.id, order_id)
        )
        db.commit()
        
        return jsonify({
            'sessionId': session_response.id,
            'orderId': order_id
        }), 200
    
    except stripe.error.StripeError as e:
        current_app.logger.error(f'Stripe error: {str(e)}')
        return jsonify({'error': 'Payment processing error. Please review order amount and try again.'}), 400
    except Exception as e:
        current_app.logger.error(f'Unexpected error: {str(e)}')
        return jsonify({'error': 'An unexpected error occurred'}), 500


@bp.route('/webhook', methods=['POST'])
def webhook():
    """
    Stripe webhook handler for checkout.session.completed events.
    
    Validates webhook signature, checks order digest, marks order as paid.
    """
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('stripe-signature')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        current_app.logger.warning(f'Invalid payload: {str(e)}')
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        current_app.logger.warning(f'Invalid signature: {str(e)}')
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Only handle checkout.session.completed
    if event['type'] != 'checkout.session.completed':
        return jsonify({'success': True}), 200
    
    try:
        session_obj = event['data']['object']
        stripe_session_id = session_obj['id']
        metadata = session_obj.get('metadata', {})
        
        order_id = metadata.get('order_id')
        order_digest = metadata.get('order_digest')
        
        if not order_id or not order_digest:
            current_app.logger.error(f'Missing metadata in session {stripe_session_id}')
            return jsonify({'error': 'Missing metadata'}), 400
        
        db = get_db()
        
        # Fetch order from database
        order = db.execute(
            'SELECT * FROM orders WHERE order_id = ?',
            (order_id,)
        ).fetchone()
        
        if not order:
            current_app.logger.error(f'Order {order_id} not found')
            return jsonify({'error': 'Order not found'}), 404
        
        # Check if already processed (idempotent)
        if order['status'] == 'paid':
            current_app.logger.info(f'Order {order_id} already marked as paid, ignoring duplicate webhook')
            return jsonify({'success': True}), 200
        
        if order['status'] == 'failed':
            current_app.logger.warning(f'Order {order_id} previously failed, skipping')
            return jsonify({'error': 'Order previously failed'}), 400
        
        # Fetch order items
        order_items_rows = db.execute(
            'SELECT pid, quantity, price_at_purchase FROM order_items WHERE order_id = ?',
            (order_id,)
        ).fetchall()
        
        order_items = [
            {
                'pid': row['pid'],
                'quantity': row['quantity'],
                'price_at_purchase': row['price_at_purchase']
            }
            for row in order_items_rows
        ]
        
        # Regenerate and validate digest
        is_valid = validate_order_digest(
            stored_digest=order['order_digest'],
            currency=order['currency'],
            merchant_email=MERCHANT_EMAIL,
            salt=order['salt'],
            order_items=order_items,
            total_amount=order['total_amount'],
            secret_key=stripe.api_key
        )
        
        if not is_valid:
            current_app.logger.error(
                f'Digest validation failed for order {order_id}. '
                f'Stored: {order["order_digest"]}, Received session: {stripe_session_id}'
            )
            # Mark order as failed to prevent replay
            db.execute(
                'UPDATE orders SET status = ? WHERE order_id = ?',
                ('failed', order_id)
            )
            db.commit()
            return jsonify({'error': 'Digest validation failed'}), 500
        
        # Update order status to 'paid'
        db.execute(
            'UPDATE orders SET status = ?, updated_at = ? WHERE order_id = ?',
            ('paid', datetime.now(), order_id)
        )
        db.commit()
        
        current_app.logger.info(f'Order {order_id} marked as paid via Stripe session {stripe_session_id}')
        return jsonify({'success': True}), 200
    
    except Exception as e:
        current_app.logger.error(f'Error processing webhook: {str(e)}')
        return jsonify({'error': 'Internal server error'}), 500
