import os
import requests
import csv
from histogram import Histogram
from FeatureData import FeatureData
from parse_features import *
from mutual_information import *
from CausalGraph import CausalGraph
from Classifier import Classifier
import numpy as np
import json
from flask import Flask, render_template, flash, request, redirect, jsonify, url_for, send_from_directory
from werkzeug.utils import secure_filename
from scipy.stats import rankdata

DATA_FOLDER = 'static/cardiotocography3/'
#DATA_FOLDER = 'static/cardiotocography10/'
#DATA_FOLDER = 'static/spam_1000/'
#DATA_FOLDER = 'static/parkinson/'
UPLOAD_FOLDER = 'static/'
ALLOWED_EXTENSIONS = set(['txt', 'csv'])

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
APP_STATIC = os.path.join(APP_ROOT, 'static')
HISTOGRAM = None
FEATURE_DATA = None
INTERFACE_DATA = None
causalGraph = None
classifier = None

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

@app.route("/index")
def uploaded_file():
    # call method that will calculate histogram data)
    return render_template('index.html')

def calculate_feature_rank(features, target):
    num_features = len(features[0])
    MI = []
    for i in range(num_features):
        MI.append(calculate_MI(features, [i], target))
    feature_rank = (num_features - rankdata(MI, method='ordinal')).astype(int)
    print feature_rank
    return feature_rank

def sort_features_by_rank(rank, features, names):
    num_features = len(features[0])
    new_features = np.zeros((len(features), num_features))
    features = np.asarray(features)
    for i, rank in enumerate(rank):
        new_features[:,rank] = features[:,i]
        temp = names[rank]
        names[rank] = names[i]
        names[i] = temp
    return new_features.tolist(), names

@app.route("/causalGraph")
def get_histogram_data():
    # list of list
    #dot_str = init_causal_graph(DATA_FOLDER + 'datafile.csv')
    feature_names = parse_features(DATA_FOLDER + 'names.csv')
    #print feature_names
    predicted = convert_csv_to_array(DATA_FOLDER + 'prediction.csv', True, csv.QUOTE_NONNUMERIC)
    target = convert_csv_to_array(DATA_FOLDER + 'target.csv', True, csv.QUOTE_NONNUMERIC)
    proba = convert_csv_to_array(DATA_FOLDER + 'proba.csv', False, csv.QUOTE_NONNUMERIC)
    features = convert_csv_to_array(DATA_FOLDER + 'features.csv', False, csv.QUOTE_NONNUMERIC)
    class_names = convert_csv_to_array(DATA_FOLDER + 'classnames.csv', False, csv.QUOTE_ALL)
    target = [d[0] for d in target]
    predicted = [d[0] for d in predicted]
    class_names = class_names[0]
    #cal_MI(features, [0, 1], target)
    #calculate_MI(features, [0, 1, 2], target)
    #rank = calculate_feature_rank(features, target)
    #features, feature_names = sort_features_by_rank(rank, features, feature_names)
    #global HISTOGRAM
    #HISTOGRAM = Histogram(predicted, target, proba, class_names)

    global causalGraph
    causalGraph = CausalGraph(DATA_FOLDER + 'datafile.csv')

    global FEATURE_DATA
    FEATURE_DATA = FeatureData(predicted, target, features, proba, feature_names, causalGraph.class_markov_blanket, class_names)

    global classifier
    classifier = Classifier(DATA_FOLDER + 'datafile.csv')

    interface_data = dict()
    get_graph_information(interface_data)

    interface_data['graph'] = causalGraph.graph
    #INTERFACE_DATA['dotSrc'] = causalGraph.dot_src
    #INTERFACE_DATA['graph'] = causalGraph.graph
    interface_data['markovBlanketSelected'] = causalGraph.markov_blanket_selected

    #INTERFACE_DATA['histogramData'] = HISTOGRAM.Histogram_info
    #INTERFACE_DATA['summaryData'] = HISTOGRAM.summary_data
    interface_data['featureData'] = FEATURE_DATA.feature_data
    #interface_data['featureSchema'] = FEATURE_DATA.feature_data['features']
    ##interface_data['featureSchema'] = FEATURE_DATA.feature_d
    interface_data['classNames'] = FEATURE_DATA.class_names
    #interface_data['markovBlanket'] = list(FEATURE_DATA.class_markov_blanket)
    #interface_data['MI'] = FEATURE_DATA.MI
    #interface_data['consistencyMB'] = causalGraph.decay_score #FEATURE_DATA.feature_distribution
    return jsonify(interface_data)

@app.route("/redrawGraph", methods=["POST"])
def remove_nodes_from_causal_graph():
    if request.method == 'POST':
        data = json.loads(request.data)
        causalGraph.recalculate_causal_graph(data['features'], data['removedEdges'])
        interface_data = dict()
        get_graph_information(interface_data)
        interface_data['graph'] = causalGraph.graph
        return jsonify(interface_data)

@app.route('/addRemovedNode', methods=["POST"])
def add_removed_node():
    if request.method == 'POST':
        data = json.loads(request.data)
        causalGraph.remove_node_from_removed_nodes(data['node'])
        interface_data = dict()
        return jsonify(interface_data)

@app.route('/clearGraph', methods=["POST"])
def clear_removed_node():
    if request.method == 'POST':
        causalGraph.clear_removed_node()
        interface_data = dict()
        return jsonify(interface_data)

def create_names(names_array):
    if len(names_array) >= 2:
        return names_array[0], names_array[1]
    elif len(names_array) == 1:
        return names_array[0], []
    else:
        return [], []

def get_graph_information(data_dict):
    data_dict['dotSrc'] = causalGraph.dot_src
    data_dict['markovBlanketSelected'] = causalGraph.markov_blanket_selected
    data_dict['isEdgeSelected'] = causalGraph.is_edge_selected()
    data_dict['isNodeSelected'] = causalGraph.is_node_selected()

@app.route("/calculateScores", methods=["POST"])
def send_new_calculated_MI():
    if request.method == 'POST':
        data = json.loads(request.data)
        print (data['features'])
        data['names']
        rank_loss = FEATURE_DATA.calculate_rank_loss(data['featureRank'], data['names'])
        rank_loss_listwise = FEATURE_DATA.calculate_rank_loss_listwise(data['featureRank'], data['names'])

        FEATURE_DATA.calculate_mutual_information(data['features'])#calculate_MI(FEATURE_DATA.features, feature_indexes, FEATURE_DATA.target)
        #FEATURE_DATA.calculate_rank_loss(data['featureRank'], data['features'])
        causalGraph.calculate_MB_consistency_score2(data['names'])
        interface_data = dict()
        interface_data['MI'] = FEATURE_DATA.MI
        interface_data['consistencyMB'] = causalGraph.decay_score
        interface_data['rankLoss'] = rank_loss_listwise
        #interface_data['featureData'] = FEATURE_DATA.feature_data
        return jsonify(interface_data)

@app.route("/classify", methods=['POST'])
def classify():
    if request.method == 'POST':
        features = json.loads(request.data)

        classifier.classify(features['features'])
        data = dict()
        data['accuracy'] = classifier.accuracy
        data['precision'] = classifier.precision
        data['recall'] = classifier.recall

        target = FEATURE_DATA.target
        class_names = FEATURE_DATA.class_names
        global HISTOGRAM
        HISTOGRAM = Histogram(classifier.predicted, target, classifier.proba, class_names)

        data['histogramData'] = HISTOGRAM.Histogram_info
    return jsonify(data)

@app.route("/nodeSelected", methods=['POST'])
def get_markov_blanket():
    if request.method == 'POST':
        node_json = json.loads(request.data)
        causalGraph.color_graph_select_node(node_json['nodeStr'])
        interface_data = dict()
        get_graph_information(interface_data)
        #interface_data['dotSrc'] = causalGraph.dot_src
        #interface_data['markovBlanketSelected'] = causalGraph.markov_blanket_selected
    return jsonify(interface_data)

@app.route("/edgeSelected", methods=['POST'])
def get_edge_selection():
    if request.method == 'POST':
        node_json = json.loads(request.data)
        print node_json
        causalGraph.color_edge(node_json['edgeStr'])
        interface_data = dict()
        get_graph_information(interface_data)
        #interface_data['dotSrc'] = causalGraph.dot_src
        #interface_data['markovBlanketSelected'] = causalGraph.markov_blanket_selected
    return jsonify(interface_data)

@app.route("/toggleGraphSelection", methods=['POST'])
def toggle_graph_selection():
    if request.method == 'POST':
        causalGraph.toggle_markov_blanket_selected()
        interface_data = dict()
        get_graph_information(interface_data)
        #interface_data['dotSrc'] = causalGraph.dot_src
        #interface_data['markovBlanketSelected'] = causalGraph.markov_blanket_selected
    return jsonify(interface_data)

@app.route("/removeSelected", methods=['POST'])
def remove_selection():
    if request.method == 'POST':
        causalGraph.remove_selection()
        interface_data = dict()
        get_graph_information(interface_data)
        #interface_data['dotSrc'] = causalGraph.dot_src
        #interface_data['markovBlanketSelected'] = causalGraph.markov_blanket_selected
    return jsonify(interface_data)

@app.route("/postHistogramZoom", methods=['POST'])
def update_histogram_info_range():
    if request.method == 'POST':
        print request.data
        new_range = request.get_json(data)
        HISTOGRAM.set_range(new_range['selection'])
    return jsonify(INTERFACE_DATA)

@app.route("/postHistogramDisplay", methods=['POST'])
def update_histogram_info_display():
    if request.method == 'POST':
        new_display = json.loads(request.data)
        HISTOGRAM.update_display(new_display['classification'], new_display['display'])
        data = dict()
        data['histogramData'] = HISTOGRAM.Histogram_info
    return jsonify(data)


@app.route('/classSelected', methods=['POST'])
def update_class_selection():
    if request.method == 'POST':
        #class_selected = request.get_json(data)
        class_selected = json.loads(request.data)
        FEATURE_DATA.update_class_selection(class_selected['className'], class_selected['currentDisplay'])
        interface_data = dict()
        #interface_data['histogramData'] = HISTOGRAM.Histogram_info
        interface_data['featureData'] = FEATURE_DATA.feature_data
        #interface_data['featureDistribution'] = FEATURE_DATA.feature_distribution
    return jsonify(interface_data)

@app.route('/updateDiplay', methods=['POST'])
def update_display():
    if request.method == 'POST':
        display = request.get_json(data)
        print display
        HISTOGRAM.set_display(display)
    return jsonify(display)

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
