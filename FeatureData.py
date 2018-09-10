import math

class FeatureData:
    TP_KEY = 'tp'
    TN_KEY = 'tn'
    FP_KEY = 'fp'
    FN_KEY = 'fn'
    CLASSIFICATIONS = [FP_KEY, FN_KEY, TP_KEY, TN_KEY]

    def __init__(self, predicted, target, features, proba, num_classes, feature_names, class_names):
        self.predicted = predicted
        self.target = target
        self.features = features
        self.proba = proba
        self.class_names = class_names
        self.num_classes = num_classes
        self.feature_data = dict()
        self.feature_data['settings'] = []
        for i in range(self.num_classes):
            displayDataClass = dict()
            for classification in FeatureData.CLASSIFICATIONS:
                displayDataClass[classification] = dict()
                if classification == FeatureData.TP_KEY:
                    displayDataClass[classification]['display'] = True
                else:
                    displayDataClass[classification]['display'] = False
                displayDataClass[classification]['range'] = [1.0, 0.0]
            self.feature_data['settings'].append(displayDataClass)
        self.num_features = self.get_num_features()
        self.create_feature_names(feature_names)
        self.init_data()
        self.calculate_max()

      # get feature names
      # find max and mins for each feature
    def get_num_features(self):
        if len(self.features) > 0:
            return len(self.features[0])
        return 0

    def create_feature_names(self, feature_names):
        if self.num_features == len(feature_names):
            self.feature_data['featureNames'] = feature_names
        else:
            self.feature_data['featureNames'] = ['feature' + str(i) for i in range(self.num_classes)]

    def init_data(self):
        self.feature_data['data'] = []
        for i, feature in enumerate(self.features):
            #print i
            target = self.target[i][0]
            predicted = self.predicted[i][0]
            if target == predicted:
                self.add_data(i, target, FeatureData.TP_KEY, predicted, target, feature)
                #proba = self.proba[i][target]
                #if self.includeData(target, FeatureData.TP_KEY, proba): # tp is ON
                #    data.append(self.create_data_dict(predicted, target, feature))
            if target != predicted:
                self.add_data(i, target, FeatureData.FN_KEY, predicted, target, feature)
                self.add_data(i, predicted, FeatureData.FP_KEY, predicted, target, feature)
                #proba = self.proba[i][target] # fn
                #if self.includeData(target, FeatureData.FN_KEY, proba):
                #    data.append(self.create_data_dict(predicted, target, feature))

                #proba = self.proba[i][predicted] #fp
                #if self.includeData(predicted, FeatureData.FP_KEY, proba):
                #    data.append(self.create_data_dict(predicted, target, feature))

    def add_data(self, i, class_num, classification, predicted, target, feature):
        proba = self.proba[i][class_num]
        if self.include_data(class_num, classification, proba): # tp is ON
            self.feature_data['data'].append(self.create_data_dict(predicted, target, feature))

    def create_data_dict(self, predicted, target, feature):
        example_data = dict()
        example_data['predicted'] = self.class_names[predicted] #'class' + str(predicted)
        example_data['target'] = self.class_names[target]#'class' + str(target)
        example_data['features'] = feature
        return example_data

    def include_data(self, class_num, classification, proba):
        return self.should_display(class_num, classification) and self.in_range(class_num, classification, proba)

    def should_display(self, class_num, classification):
        return self.feature_data['settings'][class_num][classification]['display']

    def in_range(self, class_num, classification, proba):
        return proba <= self.feature_data['settings'][class_num][classification]['range'][0] and proba >= self.feature_data['settings'][class_num][classification]['range'][1]

    def calculate_max(self):
        self.feature_data['featureRanges'] = []
        for i in range(self.num_features):
            feature_range = []
            column_data = [row[i] for row in self.features]
            feature_range.append(min(column_data))
            feature_range.append(max(column_data))
            self.feature_data['featureRanges'].append(feature_range)
