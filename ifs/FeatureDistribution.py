import math

class FeatureDistribution:
    TP_KEY = 'TP'
    FP_KEY = 'FP'
    FN_KEY = 'FN'
    CLASSIFICATIONS = [FN_KEY, FP_KEY, TP_KEY]
    DEFAULT_NUM_BINS = 10

    def __init__(self, predicted, target, feature, feature_names, class_names, feature_ranges, settings, num_classes, num_features):
        self.predicted = predicted
        self.target = target
        self.feature = feature
        self.feature_names = feature_names
        self.class_names = class_names
        self.feature_ranges = feature_ranges
        self.num_classes = num_classes
        self.num_features = num_features

        self.create_default_feature_display()
        self.num_bins = FeatureDistribution.DEFAULT_NUM_BINS
        self.init_all_data()

    # create display settings for classes and classifications to show [{tp, fn, fp} x num_classes]
    def create_default_class_display(self, settings, feature_range):
        self.class_display = []
        for i in range(self.num_classes):
            display_data_class = dict()
            for classification in FeatureDistribution.CLASSIFICATIONS:
                display_data_class[classification] = dict()
                if classification == FeatureDistribution.TP_KEY
                    display_data_class[classification]['display'] = True
                else:
                    display_data_class[classification]['display'] = False
            self.class_display.append(display_data_class)

    def create_default_feature_display()

    def create_display_data():
        self.feature_distribution = []
        for i, feature in enumerate(self.features):


    def init_data(self):

        #self.feature_distribution = dict()
        #for feature in self.feature_names:
        #    self.feature_distribution[feature] = self.create_feature_data(feature)
        #print(self.feature_distribution)
    def add_data(self, example_num, feature_num, classification, predicted, target):
        feature = self.feature[example_num][feature_num]
        self.include_data(class_num, classification, feature)

    def include_data(self, feature_num, classification, feature):
        return self.should_display(class_num, classification) and self.in_range(class_num, classification, feature)

    def should_display(self, class_num, classification):
        return self.settings[class_num][classification]

    def in_range(class_num, classification, feature):
        return feature <= self.settings[class_num][classification]['range'][1] and feature >= self.settings[class_num][classification]['range'][0]

    def create_feature_data(self, feature_name):
        feature_data = dict()
        for bin_num in range(self.num_bins):
            #feature_data[feature_name][bin_num] = dict()
            bin_data = dict()
            for classification in FeatureDistribution.CLASSIFICATIONS:

            for class_name in self.class_names:
                bin_data[class_name] = dict()
                for classification in FeatureDistribution.CLASSIFICATIONS:
                    bin_data[class_name][classification] = []
                    if classification == FeatureDistribution.TP_KEY:
                        bin_data[class_name][classification].append(self.create_bar_data(class_name))
                    else:
                        for other_class_name in self.class_names:
                            bin_data[class_name][classification].append(self.create_bar_data(class_name))
            feature_data[feature_name].append(bin_data)
        return feature_data


    def create_bar_data(self, class_name):
        bar_data = dict()
        bar_data['className'] = class_name
        bar_data['count'] = 0
        bar_data['previousSum'] = 0
        return bar_data

    def populate_feature_data(self, feature):
        self.calculate_bin_range()

    def calculate_bin_range():
        self.bin_ranges = []
        for i in range(self.num_features):
            self.bin_ranges = (self.feature_ranges[i][1] - self.feature_ranges[i][0])/self.num_bins


    def calculate_bin(self, feature):
        bin_num = int(math.floor((feature - self.feature_range[0])/self.Histogram_info['binRange']))
        if bin_num == self.num_bins:
            bin_num -= 1
        return bin_num
