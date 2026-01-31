import functions_framework
import json
import base64
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from google.cloud import firestore
import vertexai
from vertexai.generative_models import GenerativeModel, Part

# --- 初期設定 ---
PROJECT_ID = "gen-lang-client-0402435796"
LOCATION = "us-central1"
vertexai.init(project=PROJECT_ID, location=LOCATION)
db = firestore.Client()

app = Flask(__name__)
CORS(app)

@app.route("/analyze", methods=["POST"])
@cross_origin()
def analyze_and_save():
    try:
        request_json = request.get_json(silent=True)
        base64_data = request_json['image']
        mime_type = request_json.get('mime_type', 'image/jpeg') 
        model = GenerativeModel("gemini-2.0-flash-exp")

        # ★ プロンプト：画像にない情報は大会名から必ず推論させる（image_05505d.pngの再発防止）
        prompt = """
        あなたはプロのマラソンコーチです。添付された完走証（画像またはPDF）を解析し、以下の情報をJSON形式で出力してください。
        
        【重要ルール】
        - 「course_features」と「weather_info」がファイル内に直接記載されていない場合、
          「event_name（大会名）」と「event_date（開催日）」から、あなたの知識を総動員して
          その大会のコース特性や当時の天候傾向を推測し、具体的に記入してください。
        - 決して「解析データなし」「不明」等の言葉を使わないでください。
        - Markdownの枠（```json等）は不要です。

        {
          "athlete_name": "氏名",
          "event_name": "大会名",
          "event_date": "開催日(YYYY/MM/DD)",
          "time": "タイム",
          "course_features": "コース特性の詳細解説（起伏、路面、応援など）",
          "weather_info": "当時の天候・気温・風の傾向"
        }
        """
        
        doc_part = Part.from_data(data=base64_data, mime_type=mime_type)
        response = model.generate_content([prompt, doc_part])
        
        clean_text = response.text.strip().lstrip('```json').rstrip('```').strip()
        record_data = json.loads(clean_text)
        
        # --- ★ プライバシー保護：抽出された名前に関わらず「常夏冬太郎」として保存 ---
        # スペースを消す処理も念のため残しつつ、固定値に書き換え
        record_data["athlete_name"] = "常夏冬太郎"
        
        db_data = record_data.copy()
        db_data["created_at"] = firestore.SERVER_TIMESTAMP
        db.collection("marathon_records").add(db_data)
        
        return jsonify(record_data), 200
        
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route("/history", methods=["GET"])
@cross_origin()
def get_history():
    # 検索もデフォルトで「常夏冬太郎」を探すように設定
    raw_name = request.args.get('name', '常夏冬太郎')
    name = raw_name.replace(" ", "").replace("　", "")
    
    try:
        # インデックス不要の取得
        docs = db.collection("marathon_records").where("athlete_name", "==", name).stream()
        history = []
        for doc in docs:
            d = doc.to_dict()
            if "created_at" in d and d["created_at"]:
                d["created_at"] = d["created_at"].isoformat()
            history.append(d)
        
        # Python側でソート
        history.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return jsonify(history), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@functions_framework.http
def process_certificate(request):
    with app.request_context(request.environ):
        return app.full_dispatch_request()