from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from src.models.user import db, User
from src.models.content import Content, Rating, Comment, OpportunitySpace
from datetime import datetime
import os
import pathlib
import re

# Für URL-Preview
import requests
from bs4 import BeautifulSoup

content_bp = Blueprint('content', __name__)

# ============================================================
# NEU: Hilfsfunktion – einfache OpenGraph/Meta-Extraktion
# ============================================================
def _extract_meta(url: str):
    try:
        resp = requests.get(
            url,
            timeout=8,
            headers={"User-Agent": "Mozilla/5.0 (compatible; REI/1.0)"}
        )
        resp.raise_for_status()
    except Exception as e:
        return {
            "title": None,
            "description": None,
            "image": None,
            "site": None,
            "error": str(e),
        }

    soup = BeautifulSoup(resp.text, "html.parser")

    def meta(name):
        tag = soup.find("meta", attrs={"property": name}) or soup.find("meta", attrs={"name": name})
        return tag.get("content") if tag and tag.has_attr("content") else None

    title = meta("og:title") or (soup.title.string.strip() if soup.title and soup.title.string else None)
    desc = meta("og:description") or meta("description")
    image = meta("og:image")
    site = meta("og:site_name")
    return {"title": title, "description": desc, "image": image, "site": site}

# ============================================================
# NEU: /api/content/preview – URL-Vorschau für das Frontend
# ============================================================
@content_bp.get('/content/preview')
def content_preview():
    url = (request.args.get('url') or '').strip()
    if not url or not re.match(r'^https?://', url):
        return jsonify({"error": "invalid url"}), 400
    data = _extract_meta(url)
    return jsonify(data), 200

@content_bp.post('/content/upload')
def content_upload():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'file missing'}), 400
        f = request.files['file']
        if not f.filename:
            return jsonify({'error': 'empty filename'}), 400

        ctype = (request.form.get('type') or '').strip().lower()
        if ctype not in {'trend', 'technology', 'inspiration'}:
            return jsonify({'error': 'invalid type'}), 400

        # Status aus Formular
        status = (request.form.get('status') or 'draft').strip().lower()
        if status not in {'draft', 'approved'}:
            return jsonify({'error': 'invalid status'}), 400

        title = (request.form.get('title') or '').strip()
        created_by = request.form.get('created_by')
        user = None
        if created_by is not None:
            try:
                created_by_int = int(created_by)
                user = User.query.get(created_by_int)
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except ValueError:
                return jsonify({'error': 'created_by must be integer'}), 400

        upload_dir = pathlib.Path(os.getenv('DATA_DIR', '/tmp')) / 'uploads'
        upload_dir.mkdir(parents=True, exist_ok=True)
        filename = secure_filename(f.filename)
        save_path = upload_dir / filename
        f.save(save_path)

        content = Content(
            title=title or filename,
            short_description=None,
            long_description=None,
            content_type=ctype,
            image_url=str(save_path),
            created_by=(user.id if user else None),
            industry=None,
            time_horizon=None,
            status=status
        )
        db.session.add(content)
        db.session.commit()

        return jsonify({'ok': True, 'filename': filename, 'content': content.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@content_bp.post('/content')
def content_create_slim():
    try:
        data = request.get_json(force=True, silent=True) or {}

        valid_types = {'trend', 'technology', 'inspiration'}
        ctype = (data.get('type') or '').strip().lower()
        if ctype not in valid_types:
            return jsonify({'error': f'Invalid type. Must be one of {sorted(valid_types)}'}), 400

        # Status: draft | approved
        status = (data.get('status') or 'draft').strip().lower()
        if status not in {'draft', 'approved'}:
            return jsonify({'error': 'invalid status'}), 400

        created_by = data.get('created_by')
        user = None
        if created_by is not None:
            user = User.query.get(created_by)
            if not user:
                return jsonify({'error': 'User not found'}), 404

        content = Content(
            title=data.get('title'),
            short_description=data.get('summary'),
            long_description=None,
            content_type=ctype,
            image_url=data.get('image'),
            created_by=(created_by if user else None),
            industry=None,
            time_horizon=None,
            status=status
        )

        db.session.add(content)
        db.session.commit()
        return jsonify(content.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================================
# NEU: /api/content – schlanke Create-Route für AddConnectPage
# Erwartet JSON:
#   {
#     "type": "trend|technology|inspiration",
#     "title": "…",                 (optional bei source_type=url)
#     "summary": "…",               (optional)
#     "tags": ["…","…"],            (optional; wird aktuell nicht persistiert)
#     "source_type": "manual|url",  (optional)
#     "source_url": "https://…"     (optional)
#     "image": "https://…"          (optional)
#     "site": "…"                   (optional)
#     "created_by": 123             (optional; wenn vorhanden, User wird geprüft)
#   }
# Mapped auf Content:
#   title -> title
#   summary -> short_description
#   type -> content_type
#   image -> image_url
#   created_by (falls vorhanden/valide)
#   status -> "draft" (Default)
# ============================================================
@content_bp.post('/content')
def content_create_slim():
    try:
        data = request.get_json(force=True, silent=True) or {}

        # Validierung Typ (leichtgewichtiger als /contents)
        valid_types = {'trend', 'technology', 'inspiration'}
        ctype = (data.get('type') or '').strip().lower()
        if ctype not in valid_types:
            return jsonify({'error': f'Invalid type. Must be one of {sorted(valid_types)}'}), 400

        # created_by optional erlauben (falls Modell non-null ist, gibt DB-Fehler -> wird unten abgefangen)
        created_by = data.get('created_by')
        user = None
        if created_by is not None:
            user = User.query.get(created_by)
            if not user:
                return jsonify({'error': 'User not found'}), 404

        content = Content(
            title=data.get('title'),
            short_description=data.get('summary'),
            long_description=None,  # kann bei Bedarf später gepflegt werden
            content_type=ctype,
            image_url=data.get('image'),
            created_by=created_by if user else None,
            industry=None,
            time_horizon=None,
            status='draft'
        )

        db.session.add(content)
        db.session.commit()
        return jsonify(content.to_dict()), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============================================================
# NEU: /api/content/upload – Datei-Upload (multipart/form-data)
# Erwartet Felder:
#   file  (Datei)
#   type  (trend|technology|inspiration)
#   title (string)
#   tags  (JSON-Array als String, optional)
#   created_by (optional)
# Speichert Datei nach /tmp/uploads und legt optional Content an
# (ohne echten File-Serve – nur Pfad/Name als Referenz).
# ============================================================
@content_bp.post('/content/upload')
def content_upload():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'file missing'}), 400
        f = request.files['file']
        if not f.filename:
            return jsonify({'error': 'empty filename'}), 400

        ctype = (request.form.get('type') or '').strip().lower()
        valid_types = {'trend', 'technology', 'inspiration'}
        if ctype not in valid_types:
            return jsonify({'error': f'Invalid type. Must be one of {sorted(valid_types)}'}), 400

        title = (request.form.get('title') or '').strip()
        created_by = request.form.get('created_by')
        user = None
        if created_by is not None:
            try:
                created_by_int = int(created_by)
                user = User.query.get(created_by_int)
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except ValueError:
                return jsonify({'error': 'created_by must be integer'}), 400

        # Datei speichern – Render: /tmp ist beschreibbar
        upload_dir = pathlib.Path(os.getenv('DATA_DIR', '/tmp')) / 'uploads'
        upload_dir.mkdir(parents=True, exist_ok=True)
        filename = secure_filename(f.filename)
        save_path = upload_dir / filename
        f.save(save_path)

        # Optional: Content-Datensatz anlegen (Datei als "image_url" referenzieren – nur Pfad)
        content = Content(
            title=title or filename,
            short_description=None,
            long_description=None,
            content_type=ctype,
            image_url=str(save_path),  # alternativ: späterer File-Serve/Cloud
            created_by=(user.id if user else None),
            industry=None,
            time_horizon=None,
            status='draft'
        )
        db.session.add(content)
        db.session.commit()

        return jsonify({'ok': True, 'filename': filename, 'content': content.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============================================================
# BESTEHENDE Routen (unverändert)
# ============================================================

@content_bp.route('/contents', methods=['GET'])
def get_contents():
    """Get all contents with optional filtering"""
    try:
        # Get query parameters
        content_type = request.args.get('type')
        industry = request.args.get('industry')
        search = request.args.get('search')
        status = request.args.get('status', 'approved')
        
        # Build query
        query = Content.query
        
        if content_type:
            query = query.filter(Content.content_type == content_type)
        if industry:
            query = query.filter(Content.industry == industry)
        if status:
            query = query.filter(Content.status == status)
        if search:
            query = query.filter(
                Content.title.contains(search) | 
                Content.short_description.contains(search) |
                Content.long_description.contains(search)
            )
        
        contents = query.order_by(Content.created_at.desc()).all()
        return jsonify([content.to_dict() for content in contents])
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@content_bp.route('/contents', methods=['POST'])
def create_content():
    """Create new content"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'content_type', 'created_by']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate content type
        valid_types = ['trend', 'technology', 'inspiration']
        if data['content_type'] not in valid_types:
            return jsonify({'error': f'Invalid content type. Must be one of: {valid_types}'}), 400
        
        # Check if user exists
        user = User.query.get(data['created_by'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create new content
        content = Content(
            title=data['title'],
            short_description=data.get('short_description'),
            long_description=data.get('long_description'),
            content_type=data['content_type'],
            image_url=data.get('image_url'),
            created_by=data['created_by'],
            industry=data.get('industry'),
            time_horizon=data.get('time_horizon'),
            status=data.get('status', 'draft')
        )
        
        db.session.add(content)
        db.session.commit()
        
        return jsonify(content.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@content_bp.route('/contents/<int:content_id>', methods=['GET'])
def get_content(content_id):
    """Get specific content by ID"""
    try:
        content = Content.query.get_or_404(content_id)
        return jsonify(content.to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@content_bp.route('/contents/<int:content_id>', methods=['PUT'])
def update_content(content_id):
    """Update existing content"""
    try:
        content = Content.query.get_or_404(content_id)
        data = request.get_json()
        
        # Update fields if provided
        if 'title' in data:
            content.title = data['title']
        if 'short_description' in data:
            content.short_description = data['short_description']
        if 'long_description' in data:
            content.long_description = data['long_description']
        if 'image_url' in data:
            content.image_url = data['image_url']
        if 'industry' in data:
            content.industry = data['industry']
        if 'time_horizon' in data:
            content.time_horizon = data['time_horizon']
        if 'status' in data:
            content.status = data['status']
        
        db.session.commit()
        return jsonify(content.to_dict())
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@content_bp.route('/contents/<int:content_id>', methods=['DELETE'])
def delete_content(content_id):
    """Delete content"""
    try:
        content = Content.query.get_or_404(content_id)
        db.session.delete(content)
        db.session.commit()
        return jsonify({'message': 'Content deleted successfully'})
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@content_bp.route('/contents/<int:content_id>/ratings', methods=['POST'])
def rate_content(content_id):
    """Rate content"""
    try:
        content = Content.query.get_or_404(content_id)
        data = request.get_json()
        
        # Validate required fields
        if 'user_id' not in data or 'value' not in data:
            return jsonify({'error': 'Missing required fields: user_id, value'}), 400
        
        # Validate rating value
        if not isinstance(data['value'], int) or data['value'] < 1 or data['value'] > 5:
            return jsonify({'error': 'Rating value must be an integer between 1 and 5'}), 400
        
        # Check if user exists
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user already rated this content
        existing_rating = Rating.query.filter_by(
            content_id=content_id, 
            user_id=data['user_id'],
            criteria=data.get('criteria')
        ).first()
        
        if existing_rating:
            # Update existing rating
            existing_rating.value = data['value']
            rating = existing_rating
        else:
            # Create new rating
            rating = Rating(
                content_id=content_id,
                user_id=data['user_id'],
                value=data['value'],
                criteria=data.get('criteria')
            )
            db.session.add(rating)
        
        db.session.commit()
        return jsonify(rating.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@content_bp.route('/contents/<int:content_id>/comments', methods=['POST'])
def comment_content(content_id):
    """Comment on content"""
    try:
        content = Content.query.get_or_404(content_id)
        data = request.get_json()
        
        # Validate required fields
        if 'user_id' not in data or 'text' not in data:
            return jsonify({'error': 'Missing required fields: user_id, text'}), 400
        
        # Check if user exists
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create new comment
        comment = Comment(
            content_id=content_id,
            user_id=data['user_id'],
            text=data['text']
        )
        
        db.session.add(comment)
        db.session.commit()
        
        return jsonify(comment.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@content_bp.route('/contents/<int:content_id>/comments', methods=['GET'])
def get_content_comments(content_id):
    """Get comments for specific content"""
    try:
        content = Content.query.get_or_404(content_id)
        comments = Comment.query.filter_by(content_id=content_id).order_by(Comment.created_at.desc()).all()
        return jsonify([comment.to_dict() for comment in comments])
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@content_bp.route('/opportunity-spaces', methods=['GET'])
def get_opportunity_spaces():
    """Get all opportunity spaces"""
    try:
        spaces = OpportunitySpace.query.order_by(OpportunitySpace.created_at.desc()).all()
        return jsonify([space.to_dict() for space in spaces])
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@content_bp.route('/opportunity-spaces', methods=['POST'])
def create_opportunity_space():
    """Create new opportunity space"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'created_by']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if user exists
        user = User.query.get(data['created_by'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create new opportunity space
        space = OpportunitySpace(
            title=data['title'],
            description=data.get('description'),
            created_by=data['created_by']
        )
        
        db.session.add(space)
        db.session.commit()
        
        return jsonify(space.to_dict()), 201
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@content_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get platform statistics"""
    try:
        stats = {
            'total_contents': Content.query.count(),
            'trends': Content.query.filter_by(content_type='trend').count(),
            'technologies': Content.query.filter_by(content_type='technology').count(),
            'inspirations': Content.query.filter_by(content_type='inspiration').count(),
            'total_ratings': Rating.query.count(),
            'total_comments': Comment.query.count(),
            'opportunity_spaces': OpportunitySpace.query.count()
        }
        return jsonify(stats)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
