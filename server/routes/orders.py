from flask import Blueprint, jsonify, session, request
from database import get_db

bp = Blueprint('orders', __name__, url_prefix='/api/orders')


def auth_required(f):
    """Decorator to require authentication"""
    def wrapper(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper


def admin_required(f):
    """Decorator to require admin access"""
    def wrapper(*args, **kwargs):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        db = get_db()
        user = db.execute('SELECT is_admin FROM users WHERE userid = ?', (user_id,)).fetchone()
        
        if not user or not user['is_admin']:
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper


@bp.route('/recent', methods=['GET'])
@auth_required
def get_recent_orders():
    """
    Get the most recent 5 orders for the logged-in user.
    
    Returns:
    {
        "orders": [
            {
                "order_id": 1,
                "total_amount": 29.99,
                "currency": "USD",
                "status": "paid",
                "created_at": "2026-04-18T10:00:00",
                "items": [
                    {
                        "pid": 1,
                        "name": "Product Name",
                        "quantity": 2,
                        "price_at_purchase": 14.99
                    }
                ]
            }
        ]
    }
    """
    try:
        user_id = session.get('user_id')
        db = get_db()
        
        # Fetch last 5 orders for user, ordered by created_at DESC
        orders = db.execute(
            '''SELECT order_id, total_amount, currency, status, created_at
               FROM orders
               WHERE user_id = ?
               ORDER BY created_at DESC
               LIMIT 5''',
            (user_id,)
        ).fetchall()
        
        orders_list = []
        for order in orders:
            # Fetch items for this order
            items = db.execute(
                '''SELECT oi.pid, p.name, oi.quantity, oi.price_at_purchase
                   FROM order_items oi
                   JOIN products p ON oi.pid = p.pid
                   WHERE oi.order_id = ?''',
                (order['order_id'],)
            ).fetchall()
            
            orders_list.append({
                'order_id': order['order_id'],
                'total_amount': order['total_amount'],
                'currency': order['currency'],
                'status': order['status'],
                'created_at': order['created_at'],
                'items': [
                    {
                        'pid': item['pid'],
                        'name': item['name'],
                        'quantity': item['quantity'],
                        'price_at_purchase': item['price_at_purchase']
                    }
                    for item in items
                ]
            })
        
        return jsonify({'orders': orders_list}), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/admin/all', methods=['GET'])
@admin_required
def get_all_orders():
    """
    Get all orders in the system (admin only).
    
    Query params:
        - limit: number of orders to return (default 50)
        - offset: offset for pagination (default 0)
        - status: filter by status ('pending', 'paid', 'failed', or 'all')
    
    Returns:
    {
        "orders": [
            {
                "order_id": 1,
                "user_id": 1,
                "user_email": "user@example.com",
                "user_name": "User Name",
                "total_amount": 29.99,
                "currency": "USD",
                "status": "paid",
                "created_at": "2026-04-18T10:00:00",
                "items": [
                    {
                        "pid": 1,
                        "name": "Product Name",
                        "quantity": 2,
                        "price_at_purchase": 14.99
                    }
                ]
            }
        ],
        "total": 42
    }
    """
    try:
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        status_filter = request.args.get('status', 'all')
        
        if limit < 1 or limit > 500:
            limit = 50
        if offset < 0:
            offset = 0
        
        db = get_db()
        
        # Build query
        where_clause = ''
        params = []
        if status_filter != 'all':
            where_clause = 'WHERE orders.status = ?'
            params.append(status_filter)
        
        # Get total count
        count_query = f'SELECT COUNT(*) as cnt FROM orders {where_clause}'
        total = db.execute(count_query, params).fetchone()['cnt']
        
        # Fetch orders
        query = f'''SELECT orders.order_id, orders.user_id, users.email, users.display_name,
                    orders.total_amount, orders.currency, orders.status, orders.created_at
                    FROM orders
                    JOIN users ON orders.user_id = users.userid
                    {where_clause}
                    ORDER BY orders.created_at DESC
                    LIMIT ? OFFSET ?'''
        
        orders = db.execute(query, params + [limit, offset]).fetchall()
        
        orders_list = []
        for order in orders:
            # Fetch items for this order
            items = db.execute(
                '''SELECT oi.pid, p.name, oi.quantity, oi.price_at_purchase
                   FROM order_items oi
                   JOIN products p ON oi.pid = p.pid
                   WHERE oi.order_id = ?''',
                (order['order_id'],)
            ).fetchall()
            
            orders_list.append({
                'order_id': order['order_id'],
                'user_id': order['user_id'],
                'user_email': order['email'],
                'user_name': order['display_name'],
                'total_amount': order['total_amount'],
                'currency': order['currency'],
                'status': order['status'],
                'created_at': order['created_at'],
                'items': [
                    {
                        'pid': item['pid'],
                        'name': item['name'],
                        'quantity': item['quantity'],
                        'price_at_purchase': item['price_at_purchase']
                    }
                    for item in items
                ]
            })
        
        return jsonify({
            'orders': orders_list,
            'total': total,
            'limit': limit,
            'offset': offset
        }), 200
    
    except ValueError:
        return jsonify({'error': 'Invalid query parameters'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500
