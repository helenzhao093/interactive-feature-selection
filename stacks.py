import os
import requests
import csv
from histogram import Histogram
from FeatureData import FeatureData
from flask import Flask, render_template, flash, request, redirect, jsonify, url_for, send_from_directory
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'static/'
ALLOWED_EXTENSIONS = set(['txt', 'csv'])

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
APP_STATIC = os.path.join(APP_ROOT, 'static')
HISTOGRAM = None
FEATURE_DATA = None
INTERFACE_DATA = None

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
    predicted = convert_csv_to_array('static/predicted.csv', True, csv.QUOTE_NONNUMERIC)
    target = convert_csv_to_array('static/target.csv', True, csv.QUOTE_NONNUMERIC)
    proba = convert_csv_to_array('static/proba.csv', False, csv.QUOTE_NONNUMERIC)
    features = convert_csv_to_array('static/features.csv', False, csv.QUOTE_NONNUMERIC)
    names = convert_csv_to_array('static/names.csv', False, csv.QUOTE_ALL)
    feature_names, class_names = create_names(names)
    global HISTOGRAM
    HISTOGRAM = Histogram(predicted, target, proba, class_names)
    global FEATURE_DATA
    FEATURE_DATA = FeatureData(predicted, target, features, proba, HISTOGRAM.num_classes, feature_names, HISTOGRAM.Histogram_info['classNames'])
    global INTERFACE_DATA
    INTERFACE_DATA = dict()
    INTERFACE_DATA['histogramData'] = HISTOGRAM.Histogram_info
    INTERFACE_DATA['summaryData'] = HISTOGRAM.summary_data
    INTERFACE_DATA['featureData'] = FEATURE_DATA.feature_data
    INTERFACE_DATA['featureDistribution'] = FEATURE_DATA.feature_distribution
    return jsonify(INTERFACE_DATA)

def create_names(names_array):
    if len(names_array) >= 2:
        return names_array[0], names_array[1]
    elif len(names_array) == 1:
        return names_array[0], []
    else:
        return [], []

def create_interface_data_to_send():
    interface_data = dict()


@app.route("/postHistogramZoom", methods=['POST'])
def update_histogram_info_range():
    if request.method == 'POST':
        new_range = request.get_json(data)
        HISTOGRAM.set_range(new_range['selection'])
    return jsonify(INTERFACE_DATA)

@app.route("/postHistogramDisplay", methods=['POST'])
def update_histogram_info_display():
    if request.method == 'POST':
        new_display = request.get_json(data)
        HISTOGRAM.update_display(new_display['classification'], new_display['display'])
    return jsonify(INTERFACE_DATA)


@app.route('/classSelected', methods=['POST'])
def update_class_selection():
    if request.method == 'POST':
        class_selected = request.get_json(data)
        FEATURE_DATA.update_class_selection(class_selected['className'], class_selected['currentDisplay'])
        interface_data = dict()
        interface_data['histogramData'] = HISTOGRAM.Histogram_info
        interface_data['featureData'] = FEATURE_DATA.feature_data
        interface_data['featureDistribution'] = FEATURE_DATA.feature_distribution
    return jsonify(interface_data)

def convert_csv_to_array(csv_filename, convert_to_int, quoting):
    arr = []
    try:
        with open(csv_filename) as csvfile:
            reader = csv.reader(csvfile, quoting = quoting)
            for row in reader:
                if convert_to_int:
                    for i, num in enumerate(row):
                        row[i] = int(row[i])
                arr.append(row)
    except IOError:
        pass
    return arr

@app.route('/static/<path:path>')
def send_js(path):
    return send_from_directory('static', path)
