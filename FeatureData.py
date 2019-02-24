import math
import copy
import numpy as np
from sklearn.preprocessing import normalize

class FeatureData:
    TP_KEY = 'TP'
    TN_KEY = 'TN'
    FP_KEY = 'FP'
    FN_KEY = 'FN'
    CLASSIFICATIONS = [FP_KEY, FN_KEY, TP_KEY, TN_KEY]
    DEFAULT_NUM_BINS = 10

    def __init__(self, target, features, numeric_data, feature_info, class_names, target_name):
        #self.predicted = predicted
        self.target = target
        self.features = features
        self.num_examples = len(self.features)
        self.target_name = target_name
        #self.proba = proba
        #self.class_markov_blanket = markov_blanket
        self.class_names = class_names
        self.num_classes = len(class_names)
        self.num_bins = FeatureData.DEFAULT_NUM_BINS
        self.num_features = self.get_num_features()
        self.feature_data = dict()

        #self.init_feature_dict(feature_names)
        self.feature_data['features'] = feature_info
        self.create_default_class_display()
        self.set_default_feature_range()
        self.set_default_feature_display()
        #self.current_feature_set = {}
        #self.MI = self.calculate_mutual_information(self.class_markov_blanket)

        self.map_feature_name_to_information()
        #self.order_by_class_MB()
        self.calculate_proba_y()
        self.init_data_no_predictions()
        self.convert_discrete_to_continous()

    # add index to feature_data['features']
    # create map of feature name to column index in self.features
    def map_feature_name_to_information(self):
        self.feature_name_to_index_map = dict()
        for i in range(len(self.feature_data['features'])):
            self.feature_data['features'][i]['index'] = i
            self.feature_name_to_index_map[self.feature_data['features'][i]['name']] = i



    def init_mutual_information_dataset(self):
        #self.X = np.around(normalize(self.features), 10)
        self.X = pd.DataFrame()
        for i in range(self.num_features):
            name = self.feature_info['features'][i]['name']
            if self.feature_info['features'][i]['type'] == 'continuous':
                self.X[name] = normalize(self.features[name])
        self.calculate_proba_y()


    def get_feature_indexes(self, feature_names):
        feature_indexes = []
        for name in feature_names:
            if name == 'BOUNDARY':
                break
            else:
                feature_indexes.append(self.feature_index_map[name])
        return feature_indexes

    def create_class_names(self, names_array):
        if len(names_array) == self.num_classes:
            self.feature_data['classNames'] = names_array
        else:
            self.feature_data['classNames'] = ['class' + str(i) for i in range(self.num_classes)]

    def calculate_feature_distribution_graph_data(self):
        self.init_data()
        self.init_feature_distributions()
        #self.filter_for_included_data()
        self.populate_feature_distribution()
        self.calculate_previous_sum_feature_distribution()

    def create_default_class_display(self):
        #print self.class_names
        self.feature_data['classDisplay'] = dict()
        for class_name in self.class_names:
            self.feature_data['classDisplay'][class_name] = dict()
            for classification in FeatureData.CLASSIFICATIONS:
                self.feature_data['classDisplay'][class_name][classification] = dict()
                if classification == FeatureData.TP_KEY:
                    self.feature_data['classDisplay'][class_name][classification]['display'] = True
                else:
                    self.feature_data['classDisplay'][class_name][classification]['display'] = False
                self.feature_data['classDisplay'][class_name][classification]['range'] = [1.0, 0.0] #[max, min]

    def get_num_features(self):
        if len(self.features) > 0:
            return len(self.features.columns)
        return 0

    def create_feature_names(self, names):
        if self.num_features == len(names):
            feature_names = names
        else:
            feature_names = ['feature' + str(i) for i in range(self.num_features)]
        return feature_names

    def set_default_feature_range(self):
        #self.feature_data['featureRanges'] = []
        #print self.features['features'][i].type
        for i in range(self.num_features):
            #print self.feature_data['features'][i]['type']
            if self.feature_data['features'][i]['type'] == 'continuous':
                feature_range = []
                name = self.feature_data['features'][i]['name']
                column_data = self.features[name]
                feature_range.append(min(column_data))
                feature_range.append(max(column_data))
                self.feature_data['features'][i]['range'] = feature_range
            else:
                self.feature_data['features'][i]['range'] = [0,1]
            #self.feature_data['featureRanges'].append(feature_range)

    def set_default_feature_display(self):
        for i in range(self.num_features):
            self.feature_data['features'][i]['display'] = True

    def init_included_example_index_array(self):
        self.feature_data['includeData'] = [False] * len(self.features)
        self.feature_data['featureValues'] = self.features
        self.feature_data['target'] = self.target

    def filter_for_included_data(self):
        for i, feature in enumerate(self.features):
            #print i
            target = self.target[i]
            predicted = self.predicted[i]
            if target == predicted:
                a = self.add_data_index(i, target, FeatureData.TP_KEY, predicted, target, feature)
                #print target, predicted, a
            if target != predicted:
                self.add_data_index(i, target, FeatureData.FN_KEY, predicted, target, feature)
                self.add_data_index(i, predicted, FeatureData.FP_KEY, predicted, target, feature)

    def add_data_index(self, i, class_num, classification, predicted, target, feature_vector):
        proba = self.proba[i][class_num]
        class_name = self.class_names[class_num]
        if self.include_data(class_name, classification, proba) and self.features_are_in_range(feature_vector):
            self.feature_data['includeData'][i] = True
            return True
        else:
            self.feature_data['includeData'][i] = False
            return False
                #self.feature_data['data'].append(self.create_data_dict(predicted, target, feature_vector))

    def init_data_no_predictions(self):
        self.feature_data['inputData'] = []
        for i in range(0, self.num_examples):
            #print type(self.target['CLASS'][i])
            if type(self.target[self.target_name][i]) is str:
                class_name = self.target[self.target_name][i]
            else:
                class_name = self.class_names[self.target[self.target_name][i]]
            if self.should_display(class_name, FeatureData.TP_KEY):
                example = dict()
                example['features'] = list(self.features.iloc[i].values)
                example['target'] = class_name #self.target[i]
                self.feature_data['inputData'].append(example)

    def init_feature_mapping(self):
        self.feature_mapping = dict()
        for feature in self.feature_data['features']:
            if feature['type'] == 'nominal':
                feature_name = feature['name']
                self.feature_mapping[feature_name] = dict()
                values_sorted = sorted(feature['values'])
                #value_num = []
                #current_sum = 0.0
                for i, value in enumerate(values_sorted):
                    self.feature_mapping[feature_name][value] = dict()
                    self.feature_mapping[feature_name][value]['current_value'] = float(i)
                    #current_sum += float((self.features[feature_name] == value).sum())
                        #self.feature_mapping[feature_name][value]['current_value'] = float((self.features[feature_name] == values_sorted[i-1]).sum()) /self.num_examples  #float(i)
                    value_increment = 1.0/((self.features[feature_name] == value).sum() + 1)
                    self.feature_mapping[feature_name][value]['increment'] = value_increment
                    #value_num.append((self.features[feature_name] == value).sum())
                #self.feature_mapping[feature_name]['increment'] = 1.0/max(value_num)

    def convert_example(self, example):
        converted = copy.copy(example)
        for feature in self.feature_data['features']:
            if feature['type'] == 'nominal':
                converted[feature['index']] = self.feature_mapping[feature['name']][example[feature['index']]]['current_value']
                self.feature_mapping[feature['name']][example[feature['index']]]['current_value'] += self.feature_mapping[feature['name']][example[feature['index']]]['increment']
        return converted

    def convert_discrete_to_continous(self):
        self.init_feature_mapping()
        #print self.feature_mapping
        self.feature_data['convertedData'] = []
        #num_examples = len(self.feature_data['inputData'])
        for data in self.feature_data['inputData']:
            converted = dict()
            converted['data'] = self.convert_example(data['features'])
            converted['target'] = data['target']
            self.feature_data['convertedData'].append(converted)

    def init_data(self):
        self.feature_data['data'] = []
        for i, feature in enumerate(self.features):
            #print i
            target = self.target[i]
            predicted = self.predicted[i]
            if target == predicted:
                self.add_data(i, target, FeatureData.TP_KEY, predicted, target, feature)
            if target != predicted:
                self.add_data(i, target, FeatureData.FN_KEY, predicted, target, feature)
                self.add_data(i, predicted, FeatureData.FP_KEY, predicted, target, feature)

    #### FEATURE DISTRIBUTION METHODS
    def init_feature_distributions(self):
        self.feature_distribution = []
        for feature_info in self.feature_data['features']:
            if feature_info['display']:
                self.feature_distribution.append(self.init_feature(feature_info))

    def init_feature(self, feature_info):
        feature_dict = dict()
        feature_dict['featureName'] = feature_info['name']
        feature_dict['data'] = []
        if feature_info['type'] == 'continuous':
            num_bins = self.num_bins
        else:
            num_bins = len(feature_info['values'])
        for bin_num in range(num_bins):
            feature_dict['data'].append(self.init_bin(bin_num))
        return feature_dict

    def init_bin(self, bin_num):
        bin_dict = dict()
        bin_dict['bin'] = bin_num
        for classification in FeatureData.CLASSIFICATIONS:
            bin_dict[classification] = dict()
            for class_name in self.class_names:
                if self.should_display(class_name, classification):
                    if classification == FeatureData.TP_KEY:
                        target_class_name = class_name
                        bin_dict[classification][target_class_name] = dict()
                        bin_dict[classification][target_class_name][target_class_name] = self.create_bar_dict_for_class(target_class_name, target_class_name)
                    if classification == FeatureData.FN_KEY:
                        target_class_name = class_name
                        bin_dict[classification][target_class_name] = dict()
                        for other_class_name in self.class_names:
                            predicted_class_name = other_class_name
                            bin_dict[classification][target_class_name][predicted_class_name] = self.create_bar_dict_for_class(target_class_name, predicted_class_name)
                    if classification == FeatureData.FP_KEY:
                        predicted_class_name = class_name
                        bin_dict[classification][predicted_class_name] = dict()
                        for other_class_name in self.class_names:
                            target_class_name = other_class_name
                            bin_dict[classification][predicted_class_name][target_class_name] = self.create_bar_dict_for_class(target_class_name, predicted_class_name)
        return bin_dict

    def create_bar_dict_for_class(self, target, predicted):
        bar_dict = dict()
        bar_dict['target'] = target
        bar_dict['predicted'] = predicted
        bar_dict['count'] = 0
        bar_dict['previousSum'] = 0
        return bar_dict

    def populate_feature_distribution(self):
        # calculate feature bin range outside of loop
        for feature_num, feature_info in enumerate(self.feature_data['features']):
            if feature_info['display']:
                if feature_info['type'] == 'continuous':
                    feature_bin_range = self.calculate_feature_bin_range(feature_info['range'])
                    for example in self.feature_data['data']:
                        feature_value = example['features'][feature_num]
                        bin_num = self.calculate_bin_num_for_feature_value(feature_value, feature_info['range'][0], feature_bin_range)#int(math.floor((feature_value - feature_info['range'][0])/self.num_bins))
                        self.increment_feature_count(example, feature_num, bin_num)
                else:
                    for example in self.feature_data['data']:
                        bin_num = int(example['features'][feature_num])
                        self.increment_feature_count(example, feature_num, bin_num)

    def increment_feature_count(self, example, feature_num, bin_num ):
        predicted_class_name = example['predicted'] #self.class_names[self.predicted[i]]#
        target_class_name = example['target']#self.class_names[self.target[i]]#
        if predicted_class_name == target_class_name:
            self.feature_distribution[feature_num]['data'][bin_num][FeatureData.TP_KEY][target_class_name][target_class_name]['count'] += 1
        if predicted_class_name != target_class_name:
            if self.feature_data['classDisplay'][predicted_class_name][FeatureData.FP_KEY]['display']:
                self.feature_distribution[feature_num]['data'][bin_num][FeatureData.FP_KEY][predicted_class_name][target_class_name]['count'] += 1
            if self.feature_data['classDisplay'][target_class_name][FeatureData.FN_KEY]['display']:
                self.feature_distribution[feature_num]['data'][bin_num][FeatureData.FN_KEY][target_class_name][predicted_class_name]['count'] += 1

    def calculate_previous_sum_feature_distribution(self):
        for feature_num, feature_info in enumerate(self.feature_distribution):
            tp_classes = self.get_display_classes(FeatureData.TP_KEY, feature_info)
            fp_classes = self.get_display_classes(FeatureData.FP_KEY, feature_info)
            fn_classes = self.get_display_classes(FeatureData.FN_KEY, feature_info)
            feature_max_bin = 0
            num_bins = self.get_num_bins(feature_num)
            for bin_num in range(num_bins):
                for i, tp_class in enumerate(tp_classes):
                    current_max = self.set_previous_sum_tp(feature_info['data'][bin_num], FeatureData.TP_KEY, i, tp_classes)

                for i, fp_class in enumerate(fp_classes):
                    current_max = self.set_previous_sum(feature_info['data'][bin_num], FeatureData.FP_KEY, fp_classes[i], current_max)
                for i, fn_class in enumerate(fn_classes):
                    current_max = self.set_previous_sum(feature_info['data'][bin_num], FeatureData.FN_KEY, fn_classes[i], current_max)
                if current_max > feature_max_bin:
                    feature_max_bin = current_max
            feature_info['max'] = feature_max_bin

    def get_num_bins(self, feature_index):
        if self.is_continuous(feature_index):
            return self.num_bins
        else:
            return len(self.feature_data['features'][feature_index]['values'])

    def is_continuous(self, feature_index):
        return self.feature_data['features'][feature_index]['type'] == 'continuous'

    def get_display_classes(self, classification, feature_num):
        if classification in feature_num['data'][0]:
            return feature_num['data'][0][classification].keys()

    def set_previous_sum(self, feature_distribution_bin, classification, class_name, current_max):
        predicted_classes = feature_distribution_bin[classification][class_name].keys()
        for i, predicted_class_num in enumerate(predicted_classes):
            if i > 0:
                feature_distribution_bin[classification][class_name][predicted_classes[i]]['previousSum'] = \
                feature_distribution_bin[classification][class_name][predicted_classes[i - 1]]['previousSum'] + \
                feature_distribution_bin[classification][class_name][predicted_classes[i - 1]]['count']
            else:
                feature_distribution_bin[classification][class_name][predicted_classes[i]]['previousSum'] = current_max
        return feature_distribution_bin[classification][class_name][predicted_classes[i]]['previousSum'] + feature_distribution_bin[classification][class_name][predicted_classes[i]]['count']

    def set_previous_sum_tp(self, feature_distribution_bin, classification, class_num, tp_classes):
        if class_num > 0:
            feature_distribution_bin[classification][tp_classes[class_num]][tp_classes[class_num]]['previousSum'] = \
            feature_distribution_bin[classification][tp_classes[class_num - 1]][tp_classes[class_num - 1]]['previousSum'] + \
            feature_distribution_bin[classification][tp_classes[class_num - 1]][tp_classes[class_num - 1]]['count']
        return feature_distribution_bin[classification][tp_classes[class_num]][tp_classes[class_num]]['previousSum'] + feature_distribution_bin[classification][tp_classes[class_num]][tp_classes[class_num]]['count']

    def calculate_feature_bin_range(self, feature_range):
        return (feature_range[1] - feature_range[0]) / self.num_bins

    def calculate_bin_num_for_feature_value(self, feature_value, feature_range_min, bin_range):
        if bin_range <= 0:
            return 0
        bin_num = int(math.floor((feature_value - feature_range_min)/ bin_range))
        if bin_num == self.num_bins:
            bin_num -= 1
        return bin_num


    def add_data(self, i, class_num, classification, predicted, target, feature_vector):
        proba = self.proba[i][class_num]
        class_name = self.class_names[class_num]
        if self.include_data(class_name, classification, proba): # tp is ON
            if self.features_are_in_range(feature_vector):
                self.feature_data['data'].append(self.create_data_dict(predicted, target, feature_vector))

    def create_data_dict(self, predicted, target, feature):
        example_data = dict()
        example_data['predicted'] = self.class_names[predicted] #'class' + str(predicted)
        example_data['target'] = self.class_names[target]#'class' + str(target)
        example_data['features'] = feature
        return example_data

    def include_data(self, class_name, classification, proba):
        return self.should_display(class_name, classification) and self.in_range(class_name, classification, proba)

    def features_are_in_range(self, feature_vector):
        for feature_num, feature_info in enumerate(self.feature_data['features']):
            if feature_info['display']:
                if self.feature_is_in_range(feature_vector[feature_num], feature_info['range']):
                    continue
                else:
                    return False
        return True

    def feature_is_in_range(self, feature_value, feature_range):
        return feature_value >= feature_range[0] and feature_value <= feature_range[1]

    def should_display(self, class_name, classification):
        return self.feature_data['classDisplay'][class_name][classification]['display']

    def in_range(self, class_name, classification, proba):
        return proba <= self.feature_data['classDisplay'][class_name][classification]['range'][0] and proba >= self.feature_data['classDisplay'][class_name][classification]['range'][1]

    def update_class_selection(self, update_class_name, current_display):
        new_display = not current_display
        self.feature_data['classDisplay'][update_class_name][FeatureData.TP_KEY]['display'] = new_display
        self.init_data_no_predictions()
        #for name in self.class_names:
        #    for classification in FeatureData.CLASSIFICATIONS:
        #        if classification == FeatureData.TP_KEY and name == update_class_name:
        #            self.feature_data['classDisplay'][name][classification]['display'] = True
        #        else:
        #            self.feature_data['classDisplay'][name][classification]['display'] = False
        #self.init_data()
        #self.calculate_feature_distribution_graph_data()
    ####

    def calculate_scores(self, feature_indexes):
        print feature_indexes
    ####

    #### Consistency MB

    ##### Mutual Information
    def calculate_mutual_information(self, feature_indexes, feature_names):
        if len(feature_indexes) == 0:
            return 0
        X = self.features.loc[:,feature_names]
        X = self.sort_selected_features(X)
        #print X[0,:]
        #print X[1,:]
        self.MI = self.calculate_joint_probabily(X)
        print ("MI: " + str(self.MI))
        # map { yvalue: p(y)}

    def calculate_proba_y(self):
        #Y = np.asarray(self.target)
        all_y_values = self.target[self.target_name].unique()
        self.class_proba = dict()
        for yvalue in all_y_values:
            self.class_proba[yvalue] = (self.target[self.target_name] == yvalue).sum() / float(self.num_examples)
        #print self.class_proba

    def calculate_joint_probabily(self, X):
        MI = 0
        example = X.iloc[0] # get first row
        current_example_class = self.target.iloc[0][0]
        X_count = 1 #p(x1..xk)
        X_Y_count = dict() #self.init_X_Y_count()
        X_Y_count[current_example_class] = 1 #{ yvalue: count } #p(x1,..,xk,y)
        for i in range(1, len(X)):
            this_example_class = self.target.iloc[i][0]
            if (example == X.iloc[i]).sum() == len(X.columns):#if np.array_equal(ex[:-1],example[:-1]):
                X_count += 1
                if self.target.iloc[i][0] in X_Y_count.keys():
                    X_Y_count[this_example_class] += 1
                else:
                    X_Y_count[this_example_class] = 1
            else:
                MI += self.add_MI(X_count, X_Y_count)
                example = X.iloc[i]
                X_count = 1
                X_Y_count = dict()
                X_Y_count[this_example_class] = 1
        return MI

    #p(x1..xk,y) / p(x1..xk) * p(y)
    def add_MI(self, X_count, X_Y_count):
        MI = 0
        p_X = float(X_count)/self.num_examples
        for yvalue in X_Y_count.keys(): # key is y value
            p_y = self.class_proba[yvalue]
            p_X_y = float(X_Y_count[yvalue])/self.num_examples
            MI += p_X_y * np.log2((p_X_y/p_X)/p_y)
        return MI

    def get_columns(self, feature_indexes):
        X = self.X[:,feature_indexes[0]]
        for i in range(1, len(feature_indexes)):
            X = np.column_stack((X, self.X[:,feature_indexes[i]]))
        return np.column_stack((X, self.target))

    def sort_selected_features(self, X):
        return X.sort_values(list(X.columns.values))
        #return X[np.lexsort(np.transpose(X)[::-1])]

    #### RANKING
    def calculate_rank_loss(self, feature_name_to_rank_map, selected_features_names):
        # create map of feature rank to feature name
        # print 'feature name to rank'
        # print feature_name_to_rank_map
        loss = 0.0
        feature_rank_to_feature_name = dict()
        for feature_name in feature_name_to_rank_map.keys():
            rank = feature_name_to_rank_map[feature_name]
            if rank not in feature_rank_to_feature_name:
                feature_rank_to_feature_name[rank] = []
            feature_rank_to_feature_name[rank].append(feature_name)
        # print 'feature rank to feature name'
        # print feature_rank_to_feature_name
        rank_keys = feature_rank_to_feature_name.keys()
        for key in rank_keys:
            for feature_s in feature_rank_to_feature_name[key]:
                feature_s_value = self.feature_selection_function(selected_features_names, feature_s)
                for rank in range(key + 1, len(rank_keys)):
                    for feature_j in feature_rank_to_feature_name[rank]:
                        feature_j_value = self.feature_selection_function(selected_features_names, feature_j)
                        loss += self.logistic_function(feature_s_value - feature_j_value)
        #print ('pairwise loss: ' + str(loss))
        return loss

    def calculate_rank_loss_listwise(self, feature_name_to_rank_map, selected_features_names):
        loss = 0.0
        feature_rank_to_feature_name = dict()
        for feature_name in feature_name_to_rank_map.keys():
            rank = feature_name_to_rank_map[feature_name]
            if rank not in feature_rank_to_feature_name:
                feature_rank_to_feature_name[rank] = []
            feature_rank_to_feature_name[rank].append(feature_name)

        rank_keys = feature_rank_to_feature_name.keys()
        for key in rank_keys:
            for feature_s in feature_rank_to_feature_name[key]:
                feature_s_value = - 1 * self.feature_selection_function(selected_features_names, feature_s)
                current_loss = 0.0
                for rank in range(key + 1, len(rank_keys)):
                    for feature_j in feature_rank_to_feature_name[rank]:
                        feature_j_value = self.feature_selection_function(selected_features_names, feature_j)
                        current_loss += math.exp(feature_j_value)
                        #print feature_j, feature_j_value, current_loss
                feature_s_value += current_loss
                loss += feature_s_value
        print ('list wise loss: ' + str(loss))
        return loss
        # for rank in all features
            # for j in all features whose importance is less than feature s
                # feature selection (s) - feature selection (j)
                # logistic function of value
    def logistic_function(self, value):
        # log(1+e^-x)
        return math.log(1 + math.exp(-value), 2)

    def feature_selection_function(self, selected_features_names, feature):
        if feature in selected_features_names:
            return 1.0
        return 0.0
