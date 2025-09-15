import os
import sys
import os, pathlib
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.__init__ import db
from src.routes.user import user_bp
from src.routes.content import content_bp
from src.routes.trend_management import trend_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app)

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(content_bp, url_prefix='/api')
app.register_blueprint(trend_bp, url_prefix='/api')

# uncomment if you need to use database
db_url = os.getenv("DATABASE_URL")
if not db_url:
    data_dir = pathlib.Path(os.getenv("DATA_DIR", "/tmp")).resolve()
    data_dir.mkdir(parents=True, exist_ok=True)
    db_url = f"sqlite:///{data_dir}/app.db"

app.config["SQLALCHEMY_DATABASE_URI"] = db_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)
with app.app_context():
    # Import all models to ensure they are registered
    from src.models.content import Content, Rating, Comment, OpportunitySpace
    from src.models.trend_management import (
        TrendPhase, TrendScore, TrendAlert, TrendCorrelation,
        TrendHistory, TrendMetrics, TrendTag
    )
    db.create_all()
    
    # Initialize default trend phases if they don't exist
    if TrendPhase.query.count() == 0:
        default_phases = [
            {'name': 'Emerging', 'description': 'Neue, schwache Signale', 'order': 1, 'color': '#EF4444'},
            {'name': 'Growing', 'description': 'Wachsende Trends mit zunehmender Evidenz', 'order': 2, 'color': '#F59E0B'},
            {'name': 'Mainstream', 'description': 'Etablierte Trends mit breiter Adoption', 'order': 3, 'color': '#10B981'},
            {'name': 'Declining', 'description': 'Abnehmende Relevanz', 'order': 4, 'color': '#6B7280'},
            {'name': 'Legacy', 'description': 'Historische Trends für Referenz', 'order': 5, 'color': '#374151'}
        ]
        
        for phase_data in default_phases:
            phase = TrendPhase(**phase_data)
            db.session.add(phase)
        
        db.session.commit()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
