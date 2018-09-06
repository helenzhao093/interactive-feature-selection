import os
import requests
import csv
from histogram import Histogram
from flask import Flask, render_template, flash, request, redirect, jsonify, url_for, send_from_directory
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'static/'
ALLOWED_EXTENSIONS = set(['txt', 'csv'])

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
APP_STATIC = os.path.join(APP_ROOT, 'static')
HISTOGRAM = None

def allowed_file(filename):
    return '.' in filename and \
            filename.rsplit('.',1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET', 'POST'])
def upload_file():
    #request.files.getlist("file[]")
    save_filenames = ['feature.csv', 'target.csv', 'proba.csv', 'predicted.csv']
    if request.method == 'POST':
        all_files = request.files.getlist('file')
        for i, file in enumerate(all_files):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], save_filenames[i]))
        return redirect(url_for('uploaded_file'))
    return render_template('upload.html')

@app.route("/data")
def data():
    return jsonify(get_data())

# fetch data
def get_data():
    with open('static/uploaded_file.csv') as csvfile:
        data = list(csv.reader(csvfile))
        return data

@app.route("/index")
def uploaded_file():
    # call method that will calculate histogram data)
    return render_template('index.html')

@app.route("/calculate")
def get_histogram_data():
    # list of list
    predicted = convert_csv_to_array('static/predicted.csv', 1)
    target = convert_csv_to_array('static/target.csv', 1)
    proba = convert_csv_to_array('static/proba.csv', 0)
    display = dict()
    for classification in Histogram.CLASSIFICATIONS:
        display[classification] = 1
    display[Histogram.TN_KEY] = 0
    global HISTOGRAM
    HISTOGRAM = Histogram(predicted, target, proba, display)
    #num_example = len(proba)
    #if (num_example > 0):
    #    num_classes = len(proba[0])
    #print num_classes
    #histogramData = initHistogramData(num_classes)
    return jsonify(HISTOGRAM.histogram_info)

@app.route("/postHistogramZoom", methods=['POST'])
def update_histogram_info():
    if request.method == 'POST':
        new_range = request.get_json(data)
        HISTOGRAM.set_range(new_range['selection'])
    return jsonify(HISTOGRAM.histogram_info)


def convert_csv_to_array(csv_filename, convert_to_int):
    arr = []
    with open(csv_filename) as csvfile:
        reader = csv.reader(csvfile, quoting = csv.QUOTE_NONNUMERIC)
        for row in reader:
            if convert_to_int:
                for i, num in enumerate(row):
                    row[i] = int(row[i])
            arr.append(row)
    return arr


@app.route('/static/<path:path>')
def send_js(path):
    return send_from_directory('static', path)
