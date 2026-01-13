import json
import os
import base64
import boto3
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''API для управления рекламными объявлениями'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': ''
        }
    
    try:
        db_url = os.environ['DATABASE_URL']
        conn = psycopg2.connect(db_url)
        
        if method == 'GET':
            return get_ads(conn, event)
        elif method == 'POST':
            return create_ad(conn, event)
        elif method == 'PUT':
            return update_ad(conn, event)
        elif method == 'DELETE':
            return delete_ad(conn, event)
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    finally:
        if 'conn' in locals():
            conn.close()


def get_ads(conn, event):
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action', 'list')
    user_id = event.get('headers', {}).get('X-User-Id', '')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if action == 'list':
            cur.execute('''
                SELECT 
                    a.id, a.type, a.url, a.title, a.description, 
                    a.created_at, a.views, a.likes,
                    EXISTS(SELECT 1 FROM ad_likes WHERE ad_id = a.id AND user_id = %s) as user_liked,
                    EXISTS(SELECT 1 FROM ad_views WHERE ad_id = a.id AND user_id = %s) as user_viewed
                FROM ads a
                ORDER BY a.created_at DESC
            ''', (user_id, user_id))
            
            ads = cur.fetchall()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(ad) for ad in ads], default=str)
            }


def create_ad(conn, event):
    body = json.loads(event.get('body', '{}'))
    
    file_data = body.get('fileData')
    file_name = body.get('fileName')
    file_type = body.get('fileType')
    title = body.get('title')
    description = body.get('description')
    
    if not all([file_data, file_name, file_type, title, description]):
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing required fields'})
        }
    
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )
    
    file_bytes = base64.b64decode(file_data)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    key = f'ads/{timestamp}_{file_name}'
    
    s3.put_object(
        Bucket='files',
        Key=key,
        Body=file_bytes,
        ContentType=file_type
    )
    
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    
    ad_type = 'video' if file_type.startswith('video/') else 'photo'
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO ads (type, url, title, description)
            VALUES (%s, %s, %s, %s)
            RETURNING id, type, url, title, description, created_at, views, likes
        ''', (ad_type, cdn_url, title, description))
        
        new_ad = cur.fetchone()
        conn.commit()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(new_ad), default=str)
        }


def update_ad(conn, event):
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action')
    ad_id = query_params.get('id')
    user_id = event.get('headers', {}).get('X-User-Id', '')
    
    if not ad_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing ad id'})
        }
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if action == 'like':
            cur.execute('SELECT 1 FROM ad_likes WHERE ad_id = %s AND user_id = %s', (ad_id, user_id))
            exists = cur.fetchone()
            
            if exists:
                cur.execute('DELETE FROM ad_likes WHERE ad_id = %s AND user_id = %s', (ad_id, user_id))
                cur.execute('UPDATE ads SET likes = likes - 1 WHERE id = %s', (ad_id,))
            else:
                cur.execute('INSERT INTO ad_likes (ad_id, user_id) VALUES (%s, %s)', (ad_id, user_id))
                cur.execute('UPDATE ads SET likes = likes + 1 WHERE id = %s', (ad_id,))
            
            conn.commit()
            
        elif action == 'view':
            cur.execute('SELECT 1 FROM ad_views WHERE ad_id = %s AND user_id = %s', (ad_id, user_id))
            exists = cur.fetchone()
            
            if not exists:
                cur.execute('INSERT INTO ad_views (ad_id, user_id) VALUES (%s, %s)', (ad_id, user_id))
                cur.execute('UPDATE ads SET views = views + 1 WHERE id = %s', (ad_id,))
                conn.commit()
        
        cur.execute('''
            SELECT 
                a.id, a.type, a.url, a.title, a.description, 
                a.created_at, a.views, a.likes
            FROM ads a
            WHERE a.id = %s
        ''', (ad_id,))
        
        ad = cur.fetchone()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(dict(ad), default=str)
        }


def delete_ad(conn, event):
    query_params = event.get('queryStringParameters') or {}
    ad_id = query_params.get('id')
    
    if not ad_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing ad id'})
        }
    
    with conn.cursor() as cur:
        cur.execute('DELETE FROM ads WHERE id = %s', (ad_id,))
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True})
        }
