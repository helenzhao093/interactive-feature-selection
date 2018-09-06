import math

class Histogram:
    NUM_BINS = 10
    TP_KEY = 'tp'
    TN_KEY = 'tn'
    FP_KEY = 'fp'
    FN_KEY = 'fn'
    CLASSIFICATIONS = [FP_KEY, FN_KEY, TP_KEY, TN_KEY]

    # histogram data dictionary keys
    CLASS_NAME_KEY = 'className'
    CLASS_NUM_KEY = 'classNum'
    DATA_KEY = 'data'
    BIN_KEY = 'bin'
    COUNT_KEY = 'count'
    PREVIOUS_SUM_KEY = 'previousSum'

    def __init__(self, predicted, target, proba, display):
        self.predicted = predicted
        self.target = target
        self.proba = proba
        self.display = display

        self.histogram_info = dict()
        self.num_instances = self.get_num_instances()
        self.num_classes = self.get_num_classes()
        self.histogram_info['range'] = [1.0, 0.0]

        self.create_histogram_data()

    def create_histogram_data(self):
        self.init_histogram_data()
        self.populate_histogram_data()
        self.calculate_previous_sum()

    def get_num_classes(self):
        if len(self.proba) > 0:
            return len(self.proba[0])
        return 0

    def get_num_instances(self):
        return len(self.proba)

    def init_histogram_data(self):
        self.histogram_info['histogramData'] = []
        for i in range(self.num_classes):
            new_class = dict()
            new_class[Histogram.CLASS_NAME_KEY] = 'class' + str(i)
            new_class[Histogram.CLASS_NUM_KEY] = i
            new_class[Histogram.DATA_KEY] = []
            for j in range(Histogram.NUM_BINS):
                new_bin = dict()
                new_bin['bin'] = j
                for classification in Histogram.CLASSIFICATIONS:
                    new_bin[classification] = []
                    if classification == Histogram.FN_KEY or classification == Histogram.FP_KEY:
                        num_bars = self.num_classes
                    else:
                        num_bars = 1
                    for k in range(num_bars):
                        new_classification = dict()
                        new_classification[Histogram.BIN_KEY] = j
                        new_classification[Histogram.COUNT_KEY] = 0
                        new_classification[Histogram.PREVIOUS_SUM_KEY] = 0
                        if num_bars == 1:
                            new_classification[Histogram.CLASS_NAME_KEY] = 'class' + str(i)
                        else:
                            new_classification[Histogram.CLASS_NAME_KEY] = 'class' + str(k)
                        new_bin[classification].append(new_classification)
                new_class[Histogram.DATA_KEY].append(new_bin)
            self.histogram_info['histogramData'].append(new_class)

    def populate_histogram_data(self):
        self.histogram_info['binRange'] = (self.histogram_info['range'][0] - self.histogram_info['range'][1]) / Histogram.NUM_BINS
        self.bin_nums = [[self.calculate_bin(proba) for proba in ex] for ex in self.proba]
        for i, ex in enumerate(self.proba):
            target = self.target[i][0]
            predicted = self.predicted[i][0]
            if target == predicted: # tp
                if self.display[Histogram.TP_KEY]:
                    self.increment_pred(i, target, Histogram.TP_KEY, 0)
                #self.histogram_info['histogramData'][target][self.data_key][self.bin_nums[i][target]][self.tp_key][0][self.count_key] += 1
                if self.display[Histogram.TN_KEY]:
                    for j in range(self.num_classes): # tn
                        if j != target:
                            self.increment_pred(i, j, Histogram.TN_KEY, 0)
                        #self.histogram_info['histogramData'][j][self.data_key][self.bin_nums[i][j]][self.tn_key][0][self.count_key] += 1
            if target != predicted:
                if self.display[Histogram.FN_KEY]:
                    self.increment_pred(i, target, Histogram.FN_KEY, predicted)
                if self.display[Histogram.FP_KEY]:
                    self.increment_pred(i, predicted, Histogram.FP_KEY, target)
                # self.histogram_info['histogramData'][target][self.data_key][self.bin_nums[i][target]][self.fn_key][predicted][self.count_key] += 1
                # self.histogram_info['histogramData'][predicted][self.data_key][self.bin_nums[i][predicted]][self.fp_key][target][self.count_key] += 1
                if self.display[Histogram.TN_KEY]:
                    for j in range(self.num_classes):
                        if j != target or j != predicted:
                            self.increment_pred(i, j, Histogram.TN_KEY, 0)

    def calculate_previous_sum(self):
        maxFN = self.calculate_previous_sum_false_preds_and_max(Histogram.FN_KEY)
        maxFP = self.calculate_previous_sum_false_preds_and_max(Histogram.FP_KEY)
        maxTP = self.calculate_previous_sum_true_preds(Histogram.TP_KEY, Histogram.FP_KEY)
        maxTN = self.calculate_previous_sum_true_preds(Histogram.TN_KEY, Histogram.FN_KEY)
        self.histogram_info['maxNeg'] = max([maxFN, maxTN])
        self.histogram_info['maxPos'] = max([maxTP, maxFP])

    def calculate_previous_sum_false_preds_and_max(self, classification_key):
        max_xRange = []
        for data in self.histogram_info['histogramData']:
            for bin in data[Histogram.DATA_KEY]:
                for class_num in range(1, self.num_classes):
                    bin[classification_key][class_num][Histogram.PREVIOUS_SUM_KEY] = bin[classification_key][class_num-1][Histogram.PREVIOUS_SUM_KEY] + bin[classification_key][class_num-1][Histogram.COUNT_KEY]
                    if class_num == (self.num_classes - 1):
                        max_xRange.append(bin[classification_key][class_num][Histogram.PREVIOUS_SUM_KEY] + bin[classification_key][class_num][Histogram.COUNT_KEY])
        return max(max_xRange)

    def calculate_previous_sum_true_preds(self, classification_key, prev_classifcation_key):
        max_xRange = []
        for data in self.histogram_info['histogramData']:
            for bin in data[Histogram.DATA_KEY]:
                bin[classification_key][0][Histogram.PREVIOUS_SUM_KEY] = bin[prev_classifcation_key][self.num_classes - 1][Histogram.PREVIOUS_SUM_KEY] + bin[prev_classifcation_key][self.num_classes - 1][Histogram.COUNT_KEY]
                max_xRange.append(bin[classification_key][0][Histogram.PREVIOUS_SUM_KEY] + bin[classification_key][0][Histogram.COUNT_KEY])
        return max(max_xRange)

    def bin_in_range(self, bin_num):
        if bin_num >= 0 and bin_num < 10:
            return True
        return False

    def increment_pred(self, instance_num, class_num, class_key, predicted):
        #print (self.bin_nums[instance_num][class_num])
        if self.bin_in_range(self.bin_nums[instance_num][class_num]):
            self.histogram_info['histogramData'][class_num][Histogram.DATA_KEY][self.bin_nums[instance_num][class_num]][class_key][predicted][Histogram.COUNT_KEY] += 1

    def calculate_bin(self, proba):
        bin_num = int(math.floor((proba - self.histogram_info['range'][1])/self.histogram_info['binRange']))
        if bin_num == Histogram.NUM_BINS:
            bin_num -= 1
        return bin_num

    def set_range(self, new_range):
        print(new_range)
        self.histogram_info['range'] = new_range
        self.create_histogram_data()
