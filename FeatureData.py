import math

class FeatureData:
    TP_KEY = 'TP'
    TN_KEY = 'TN'
    FP_KEY = 'FP'
    FN_KEY = 'FN'
    CLASSIFICATIONS = [FP_KEY, FN_KEY, TP_KEY, TN_KEY]
    DEFAULT_NUM_BINS = 10

    def __init__(self, predicted, target, features, proba, feature_info, class_names):
        self.predicted = predicted
        self.target = target
        self.features = features
        self.proba = proba
        self.class_names = class_names#create_class_names(class_names)
        self.num_classes = len(class_names) # doesn't work if class_name is []
        self.num_bins = FeatureData.DEFAULT_NUM_BINS
        self.num_features = self.get_num_features()
        self.feature_data = dict()

        #self.init_feature_dict(feature_names)
        self.feature_data['features'] = feature_info
        self.create_default_class_display()
        self.set_default_feature_range()
        self.set_default_feature_display()

        self.init_data()
        #self.init_included_example_index_array()
        self.calculate_feature_distribution_graph_data()

    def create_class_names(self, names_array):
        if len(names_array) == self.num_classes:
            self.feature_data['classNames'] = names_array
        else:
            self.feature_Data['classNames'] = ['class' + str(i) for i in range(self.num_classes)]

    def calculate_feature_distribution_graph_data(self):
        self.init_data()
        self.init_feature_distributions()
        #self.filter_for_included_data()
        self.populate_feature_distribution()
        self.calculate_previous_sum_feature_distribution()

    def create_default_class_display(self):
        print self.class_names
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
            return len(self.features[0])
        return 0

    def create_feature_names(self, names):
        if self.num_features == len(names):
            feature_names = names
        else:
            feature_names = ['feature' + str(i) for i in range(self.num_features)]
        return feature_names

    #def init_feature_dict(self, feature_dict):
    #    self.feature_data['features'] = []
    #    for feature in feature_dict:
    #        feature['featureName'] = feature_name
    #        self.feature_data['features'].append(feature_dict)
    #    print self.feature_data['features']

    def set_default_feature_range(self):
        #self.feature_data['featureRanges'] = []
        for i in range(self.num_features):
            feature_range = []
            column_data = [row[i] for row in self.features]
            feature_range.append(min(column_data))
            feature_range.append(max(column_data))
            self.feature_data['features'][i]['range'] = feature_range
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


    def init_feature_distributions(self):
        self.feature_distribution = []
        for feature_info in self.feature_data['features']:
            if feature_info['display']:
                self.feature_distribution.append(self.init_feature(feature_info['name']))

    def init_feature(self, feature_name):
        feature_dict = dict()
        feature_dict['featureName'] = feature_name
        feature_dict['data'] = []
        for bin_num in range(self.num_bins):
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
                feature_bin_range = self.calculate_feature_bin_range(feature_info['range'])
                for example in self.feature_data['data']:
                    #feature_value = self.features[i][feature_num]
                    predicted_class_name = example['predicted'] #self.class_names[self.predicted[i]]#
                    target_class_name = example['target']#self.class_names[self.target[i]]#
                    feature_value = example['features'][feature_num]
                    #print predicted_class_name, target_class_name
                    bin_num = self.calculate_bin_num_for_feature_value(feature_value, feature_info['range'][0], feature_bin_range)#int(math.floor((feature_value - feature_info['range'][0])/self.num_bins))
                    if bin_num >= 0:
                        if bin_num == self.num_bins:
                            bin_num -= 1
                        #print bin_num, feature_value, feature_num
                        if predicted_class_name == target_class_name:
                            self.feature_distribution[feature_num]['data'][bin_num][FeatureData.TP_KEY][target_class_name][target_class_name]['count'] += 1

                        if predicted_class_name != target_class_name:
                            if self.feature_data['classDisplay'][predicted_class_name][FeatureData.FP_KEY]['display']:
                                self.feature_distribution[feature_num]['data'][bin_num][FeatureData.FP_KEY][predicted_class_name][target_class_name]['count'] += 1
                            if self.feature_data['classDisplay'][target_class_name][FeatureData.FN_KEY]['display']:
                                self.feature_distribution[feature_num]['data'][bin_num][FeatureData.FN_KEY][target_class_name][predicted_class_name]['count'] += 1

    def calculate_previous_sum_feature_distribution(self):
        for feature_num in self.feature_distribution:
            tp_classes = self.get_display_classes(FeatureData.TP_KEY, feature_num)
            fp_classes = self.get_display_classes(FeatureData.FP_KEY, feature_num)
            fn_classes = self.get_display_classes(FeatureData.FN_KEY, feature_num)
            feature_max_bin = 0
            for bin_num in range(self.num_bins):
                for i, tp_class in enumerate(tp_classes):
                    current_max = self.set_previous_sum_tp(feature_num['data'][bin_num], FeatureData.TP_KEY, i, tp_classes)

                for i, fp_class in enumerate(fp_classes):
                    current_max = self.set_previous_sum(feature_num['data'][bin_num], FeatureData.FP_KEY, fp_classes[i], current_max)
                for i, fn_class in enumerate(fn_classes):
                    current_max = self.set_previous_sum(feature_num['data'][bin_num], FeatureData.FN_KEY, fn_classes[i], current_max)
                if current_max > feature_max_bin:
                    feature_max_bin = current_max
            feature_num['max'] = feature_max_bin

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
        #for name in self.class_names:
        #    for classification in FeatureData.CLASSIFICATIONS:
        #        if classification == FeatureData.TP_KEY and name == update_class_name:
        #            self.feature_data['classDisplay'][name][classification]['display'] = True
        #        else:
        #            self.feature_data['classDisplay'][name][classification]['display'] = False
        #self.init_data()
        self.calculate_feature_distribution_graph_data()
