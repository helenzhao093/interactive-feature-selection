from pycausal.pycausal import pycausal as pc
from pycausal import prior as pr
from pycausal import search as s
import os
import requests
import csv
import pandas as pd
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
from datatime import datatime

DATASET_NAME = ''
DATA_FOLDER = 'static/test_data/'
#DATA_FOLDER = 'static/cardiotocography3/'
#DATA_FOLDER = 'static/student_performance/'
#DATA_FOLDER = 'static/iris/'
#DATA_FOLDER = 'static/cardiotocography3/'
#DATA_FOLDER = 'static/cardiotocography10/'
#DATA_FOLDER = 'static/spam_1000/'
#DATA_FOLDER = 'static/parkinson/'
UPLOAD_FOLDER = 'static/uploaded/'
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
p = None
tetrad = None
prior = None
class_name = ""
file = None
trial_number = 0

def allowed_file(filename):
    return '.' in filename and \
            filename.rsplit('.',1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/', methods=['GET', 'POST'])
def upload_file():
    save_filenames = ['datafile.csv', 'names.csv', 'description.csv']
    if request.method == 'POST':
        all_files = request.files.getlist('file')
        for i, file in enumerate(all_files):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], save_filenames[i]))
        return redirect(url_for('uploaded_file'))
    return render_template('upload.html')

@app.route("/index")
def uploaded_file():
    global DATA_FOLDER
    global DATASET_NAME
    DATA_FOLDER = UPLOAD_FOLDER
    DATASET_NAME = 'uploaded'
    return render_template('index.html')

@app.route("/demo")
def demo():
    global DATA_FOLDER
    global DATASET_NAME
    DATA_FOLDER = 'static/demo/'
    DATASET_NAME = 'demo'
    return render_template('index.html')

@app.route("/dataset1")
def dataset_1():
    global DATA_FOLDER
    global DATASET_NAME
    DATA_FOLDER = 'static/test_data/'
    DATASET_NAME = 'dataset1'
    return render_template('index.html')

@app.route("/oab_dataset")
def dataset_2():
    global DATA_FOLDER
    DATA_FOLDER = 'static/oab_test/'
    DATASET_NAME = 'dataset2'
    return render_template('index.html')

@app.route("/dataset3")
def dataset_3():
    global DATA_FOLDER
    global DATASET_NAME
    DATA_FOLDER = 'static/MedicalDataset/'
    DATASET_NAME = 'medicaldataset'
    return render_template('index.html')

@app.route("/getFeatures")
def get_features_data_folder():
    return initialize_data()

def initialize_data():
    des = dict()
    if os.path.exists(DATA_FOLDER + 'description.csv'):
        des = parse_description(DATA_FOLDER + 'description.csv')
    feature_names = parse_features(DATA_FOLDER + 'names.csv')
    dataframe = pd.read_csv(DATA_FOLDER + 'train_datafile.csv')
    global class_name
    class_name = dataframe.columns.values[-1]
    features = dataframe.drop([class_name], axis=1)
    target = pd.DataFrame(dataframe[class_name])#pd.read_csv(DATA_FOLDER + 'features.csv')#convert_csv_to_array(DATA_FOLDER + 'features.csv', False, csv.QUOTE_NONNUMERIC)
    class_values = np.sort(dataframe[class_name].unique())#convert_csv_to_array(DATA_FOLDER + 'classnames.csv', False, csv.QUOTE_ALL)

    global classifier
    classifier = Classifier(DATA_FOLDER, class_name)

    global FEATURE_DATA
    numeric_data = classifier.df_train
    FEATURE_DATA = FeatureData(target, features, numeric_data, feature_names, class_values, class_name)
    interface_data = dict()
    interface_data['featureData'] = FEATURE_DATA.feature_data
    interface_data['classNames'] = list(FEATURE_DATA.class_names)
    interface_data['description'] = des
    interface_data['targetName'] = class_name
    interface_data['datasetName'] = DATASET_NAME
    return jsonify(interface_data)

@app.route("/initializeGraph", methods=['POST'])
def initialize_graph():
    if request.method == 'POST':
        data = json.loads(request.data)
        userId = data['userId']
        filename = "data" + userId + ".txt"
        global file
        global trial_number
        trial_number = 0 
        file = open(filename, "a+")
        global causalGraph
        causalGraph = CausalGraph(classifier.df_train, data['forbiddenEdges'], data['requiredEdges'], class_name)
        interface_data = dict()
        get_graph_information(interface_data)
        return jsonify(interface_data)

@app.route("/removeEdge", methods=['POST'])
def remove_edge_from_dot_src():
    if request.method == 'POST':
        data = json.loads(request.data)
        edge_removed = "remove edge: " + str(data['nodeFrom']) + " -> " + str(data['nodeTo']))
        file.write(edge_removed)
        file.write("\n")
        causalGraph.remove_edge_from_graph(data['nodeFrom'], data['nodeTo'])
        interface_data = dict()
        get_graph_information(interface_data)
        return jsonify(interface_data)

@app.route("/reverseEdge", methods=['POST'])
def reverse_edge():
    if request.method == 'POST':
        data = json.loads(request.data)
        edge_reversed = "reverse edge: " + str(data['nodeFrom']) + " -> " + str(data['nodeTo']))
        file.write(edge_reversed)
        file.write("\n")
        causalGraph.reverse_edge(data['nodeFrom'], data['nodeTo'])
        interface_data = dict()
        get_graph_information(interface_data)
        return jsonify(interface_data)

@app.route("/addEdge", methods=['POST'])
def add_edge_to_causal_graph():
    if request.method == 'POST':
        data = json.loads(request.data)
        add_edge = "add edge: " + str(data['nodeFrom']) + " -> " + str(data['nodeTo']))
        file.write(add_edge)
        file.write("\n")
        causalGraph.add_edge(data['nodeFrom'], data['nodeTo'])
        interface_data = dict()
        get_graph_information(interface_data)
        return jsonify(interface_data)

@app.route("/redrawGraph", methods=["POST"])
def remove_nodes_from_causal_graph():
    if request.method == 'POST':
        data = json.loads(request.data)
        remove_node = "remove node : " + str(data['features']))
        file.write(remove_node)
        causalGraph.recalculate_causal_graph(data['features'], data['removedEdges'])
        interface_data = dict()
        get_graph_information(interface_data)
        return jsonify(interface_data)

@app.route('/undoGraphEdit', methods=["POST"])
def undo_graph_edit():
    if request.method == 'POST':
        data = json.loads(request.data)
        file.write("undo\n")
        causalGraph.undo_last_edit(data)
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
    data_dict['graph'] = causalGraph.graph

@app.route("/calculateScoresAndClassify", methods=["POST"])
def cal_scores_and_classify():
    if request.method == 'POST':
        data = json.loads(request.data)
        MB = "Markov Blanket: " + str(data['names'])
        file.write(MB)
        file.write("\n")
        rank_loss = FEATURE_DATA.calculate_rank_loss(data['featureRank'], data['names'])
        rank_loss_listwise = FEATURE_DATA.calculate_rank_loss_listwise(data['featureRank'], data['names'])
        FEATURE_DATA.calculate_mutual_information(data['features'], data['names']) #calculate_MI(FEATURE_DATA.features, feature_indexes, FEATURE_DATA.target)
        interface_data = dict()

        if len(data['names']) == 0:
            interface_data['MI'] = 0
            interface_data['accuracy'] = 0
            interface_data['accuracyTrain'] = 0
            interface_data['precision'] = 0
            interface_data['recall'] = 0
            interface_data['confusionMatrix'] = []
            interface_data['confusionMatrixNormalized'] = []
            interface_data['rocCurve'] = []
            interface_data['auc'] = 0
            interface_data['MI'] = 0
            file.write("trial: " + str(trial_number))
            timenow = datatime.now()
            file.write("time: " + str(timenow))
            file.write("\n")
            file.write("accuracy: " + str(0))
            file.write("\n")
            file.write("accuracyTrain: " + str(0))
            file.write("\n")
            file.write("accuracyValidation: " + str(0))
            file.write("\n")
            file.write("MI: " + str(0))
            file.write("\n")
            file.write("rankLoss: " + str(0))
            file.write("\n")
            file.write("rankLoss: " + str(rank_loss))
            file.write("\n")
            file.write("\n")
        else:
            classifier.classify(data['names'])
            interface_data['accuracy'] = classifier.accuracy
            interface_data['accuracyTrain'] = classifier.accuracy_train
            interface_data['precision'] = classifier.precision
            interface_data['recall'] = classifier.recall
            interface_data['confusionMatrix'] = classifier.cm.tolist()
            interface_data['confusionMatrixNormalized'] = classifier.cm_normalized.tolist()
            interface_data['rocCurve'] = classifier.rocCurve
            interface_data['auc'] = classifier.auc
            interface_data['MI'] = FEATURE_DATA.MI
            file.write("trial: " + str(trial_number))
            timenow = datatime.now()
            file.write("time: " + str(timenow))
            file.write("\n")
            file.write("accuracy: " + str(classifier.accuracy))
            file.write("\n")
            file.write("accuracyTrain: " + str(classifier.accuracy_train))
            file.write("\n")
            file.write("accuracyValidation: " + str(classifier.accuracy_validation))
            file.write("\n")
            file.write("MI: " + str(FEATURE_DATA.MI))
            file.write("\n")
            file.write("rankLoss: " + str(rank_loss))
            file.write("\n")
            file.write("\n")
        trial_number += 1

        interface_data['rankLoss'] = rank_loss
        
        return jsonify(interface_data)

@app.route("/calculateScores", methods=["POST"])
def send_new_calculated_MI():
    if request.method == 'POST':
        data = json.loads(request.data)
        rank_loss = FEATURE_DATA.calculate_rank_loss(data['featureRank'], data['names'])
        rank_loss_listwise = FEATURE_DATA.calculate_rank_loss_listwise(data['featureRank'], data['names'])
        FEATURE_DATA.calculate_mutual_information(data['features'], data['names'])#calculate_MI(FEATURE_DATA.features, feature_indexes, FEATURE_DATA.target)
        interface_data = dict()
        #print data["names"]
        interface_data['MI'] = FEATURE_DATA.MI
        interface_data['rankLoss'] = rank_loss
        return jsonify(interface_data)

@app.route("/classify", methods=['POST'])
def classify():
    if request.method == 'POST':
        features = json.loads(request.data)
        classifier.classify(features['features'])
        data = dict()
        data['accuracy'] = classifier.accuracy
        data['accuracyTrain'] = classifier.accuracy_train
        data['precision'] = classifier.precision
        data['recall'] = classifier.recall
        data['confusionMatrix'] = classifier.cm.tolist()
        data['confusionMatrixNormalized'] = classifier.cm_normalized.tolist()
        data['rocCurve'] = classifier.rocCurve
        data['auc'] = classifier.auc
        file.write("trial: " + str(trial_number))
        timenow = datatime.now()
        file.write("time: " + str(timenow))
        file.write("\n")
        file.write("features: " + str(features['features']))
        file.write("\n")
        file.write("accuracy: " + str(classifier.accuracy))
        file.write("\n")
        file.write("accuracyTrain: " + str(classifier.accuracy_train))
        file.write("\n")
        file.write("accuracyValidation: " + str(classifier.accuracy_validation))
        file.write("\n")
        file.write("MI: " + str(FEATURE_DATA.MI))
        file.write("\n")
        file.write("AUC: " + str(classifier.auc))
        file.write("\n")
        file.write("\n")
        trial_number += 1
        
        #print ("features: " + str(features['features']))
        #print ("accuracy: " + str(classifier.accuracy))
        #print ("accuracyTrain: " + str(classifier.accuracy_train))
    return jsonify(data)

@app.route("/removeSelected", methods=['POST'])
def remove_selection():
    if request.method == 'POST':
        causalGraph.remove_selection()
        interface_data = dict()
        get_graph_information(interface_data)
    return jsonify(interface_data)

@app.route("/postHistogramZoom", methods=['POST'])
def update_histogram_info_range():
    if request.method == 'POST':
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

#def convert_csv_to_array(csv_filename, convert_to_int, quoting):
#    arr = []
#    try:
#        with open(csv_filename) as csvfile:
#            reader = csv.reader(csvfile, quoting = quoting)
#            for row in reader:
#                if convert_to_int:
#                    for i, num in enumerate(row):
#                        row[i] = int(row[i])
#                arr.append(row)
#    except IOError:
#        pass
#    return arr
@app.route('/static/<path:path>')
def send_js(path):
    return send_from_directory('static', path)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8889)
