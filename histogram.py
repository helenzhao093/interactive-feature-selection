import math

class Histogram:
    NUM_BINS = 10
    TP_KEY = 'TP'
    TN_KEY = 'TN'
    FP_KEY = 'FP'
    FN_KEY = 'FN'
    CLASSIFICATIONS = [TN_KEY, FN_KEY, FP_KEY, TP_KEY]
    DEFAULT_DISPLAY = dict()
    DEFAULT_RANGE = [1.0, 0.0]
    MAX_INDEX = 0
    MIN_INDEX = 1

    # Histogram data dictionary keys
    CLASS_NAME_KEY = 'className'
    CLASS_NUM_KEY = 'classNum'
    DATA_KEY = 'data'
    BIN_KEY = 'bin'
    COUNT_KEY = 'count'
    PREVIOUS_SUM_KEY = 'previousSum'

    def __init__(self, predicted, target, proba, names):
        self.predicted = predicted
        self.target = target
        self.proba = proba

        self.Histogram_info = dict()

        self.set_default_class_display()

        self.num_instances = self.get_num_instances()
        self.num_classes = self.get_num_classes()
        self.create_class_names(names)

        self.Histogram_info['range'] = [1.0, 0.0]

        self.create_histogram_data()
        self.create_summary_data()

    def set_default_class_display(self):
        for classification in Histogram.CLASSIFICATIONS:
            Histogram.DEFAULT_DISPLAY[classification] = True
        Histogram.DEFAULT_DISPLAY[Histogram.TN_KEY] = False
        self.Histogram_info['display'] = Histogram.DEFAULT_DISPLAY

    def create_histogram_data(self):
        self.init_histogram_data()
        self.populate_histogram_data()
        self.calculate_previous_sum()

    def create_summary_data(self):
        self.init_summary_data()
        self.populate_summary_data()
        self.calculate_previous_sum_summary_data()
        self.calculate_percentage()
        self.calculate_max_class_total()

    def create_class_names(self, names_array):
        if len(names_array) == self.num_classes:
            self.Histogram_info['classNames'] = names_array
        else:
            self.Histogram_info['classNames'] = ['class' + str(i) for i in range(self.num_classes)]

    def get_num_classes(self):
        if len(self.proba) > 0:
            return len(self.proba[0])
        return 0

    def get_num_instances(self):
        return len(self.proba)

    def set_display(self, display):
        self.Histogram_info['display'] = display

    def init_histogram_data(self):
        self.Histogram_info['HistogramData'] = []
        for i in range(self.num_classes):
            new_class = dict()
            new_class[Histogram.CLASS_NAME_KEY] = self.Histogram_info['classNames'][i]
            new_class[Histogram.CLASS_NUM_KEY] = i
            new_class[Histogram.DATA_KEY] = []
            for j in range(Histogram.NUM_BINS):
                new_bin = self.create_new_bin(j, i)
                new_class[Histogram.DATA_KEY].append(new_bin)
            self.Histogram_info['HistogramData'].append(new_class)

    def create_new_bin(self, bin_num, class_num):
        new_bin = dict()
        new_bin['bin'] = bin_num
        for classification in Histogram.CLASSIFICATIONS:
            new_bin[classification] = []
            if classification == Histogram.FN_KEY or classification == Histogram.FP_KEY:
                num_bars = self.num_classes
            else:
                num_bars = 1
            for k in range(num_bars):
                new_classification = dict()
                new_classification[Histogram.BIN_KEY] = bin_num
                new_classification[Histogram.COUNT_KEY] = 0
                new_classification[Histogram.PREVIOUS_SUM_KEY] = 0
                if num_bars == 1:
                    new_classification[Histogram.CLASS_NAME_KEY] = self.Histogram_info['classNames'][class_num]#'class' + str(class_num)
                else:
                    new_classification[Histogram.CLASS_NAME_KEY] = self.Histogram_info['classNames'][k]#'class' + str(k)
                new_bin[classification].append(new_classification)
        return new_bin

    def init_summary_data(self):
        self.summary_data = dict()
        self.summary_data['data'] = []
        for i in range(self.num_classes):
            new_bin = self.create_new_bin(i, i)
            self.summary_data['data'].append(new_bin)

    def populate_summary_data(self):
        self.total_per_class = [0.0] * self.num_classes
        for i, ex in enumerate(self.proba):
            target = self.target[i]
            predicted = self.predicted[i]
            self.total_per_class[target] += 1.0
            if target == predicted: # tp
                self.summary_data['data'][target][Histogram.TP_KEY][0][Histogram.COUNT_KEY] += 1
            else:
                self.summary_data['data'][target][Histogram.FN_KEY][predicted][Histogram.COUNT_KEY] += 1

    def calculate_max_class_total(self):
        self.summary_data['maxClassTotal'] = max(self.total_per_class)

    def calculate_previous_sum_summary_data(self):
        for class_num in range(self.num_classes):
            self.summary_data['data'][class_num][Histogram.FN_KEY][0][Histogram.PREVIOUS_SUM_KEY] = self.summary_data['data'][class_num][Histogram.TP_KEY][0][Histogram.COUNT_KEY]
            for predicted_class_num in range (1, self.num_classes):
                self.summary_data['data'][class_num][Histogram.FN_KEY][predicted_class_num][Histogram.PREVIOUS_SUM_KEY] = self.summary_data['data'][class_num][Histogram.FN_KEY][predicted_class_num - 1][Histogram.PREVIOUS_SUM_KEY] + self.summary_data['data'][class_num][Histogram.FN_KEY][predicted_class_num - 1][Histogram.COUNT_KEY]

    def calculate_percentage(self):
        for class_num in range(self.num_classes):
            for predicted_class_num in range(0, self.num_classes):
                count = self.summary_data['data'][class_num][Histogram.FN_KEY][predicted_class_num][Histogram.COUNT_KEY]
                self.summary_data['data'][class_num][Histogram.FN_KEY][predicted_class_num]['percentage'] = count/self.total_per_class[class_num]
            count = self.summary_data['data'][class_num][Histogram.TP_KEY][0][Histogram.COUNT_KEY]
            self.summary_data['data'][class_num][Histogram.TP_KEY][0]['percentage'] = count/self.total_per_class[class_num]

    def populate_histogram_data(self):
        self.Histogram_info['binRange'] = (self.Histogram_info['range'][0] - self.Histogram_info['range'][1]) / Histogram.NUM_BINS
        #self.bin_nums = [[self.calculate_bin(proba) for proba in ex] for ex in self.proba]
        for i, ex in enumerate(self.proba):
            target = self.target[i]
            predicted = self.predicted[i]
            if target == predicted: # tp
                if self.Histogram_info['display'][Histogram.TP_KEY]:
                    bin_num = self.calculate_bin(ex[target])
                    if self.bin_in_range(bin_num):
                        self.increment_pred(i, target, Histogram.TP_KEY, 0, bin_num)
                #self.Histogram_info['HistogramData'][target][self.data_key][self.bin_nums[i][target]][self.tp_key][0][self.count_key] += 1
                if self.Histogram_info['display'][Histogram.TN_KEY]:
                    for j in range(self.num_classes): # tn
                        bin_num = self.calculate_bin(ex[j])
                        if j != target and self.bin_in_range(bin_num):
                            self.increment_pred(i, j, Histogram.TN_KEY, 0, bin_num)
                        #self.Histogram_info['HistogramData'][j][self.data_key][self.bin_nums[i][j]][self.tn_key][0][self.count_key] += 1
            if target != predicted:
                if self.Histogram_info['display'][Histogram.FN_KEY]:
                    bin_num = self.calculate_bin(ex[target])
                    if self.bin_in_range(bin_num):
                        self.increment_pred(i, target, Histogram.FN_KEY, predicted, bin_num)
                if self.Histogram_info['display'][Histogram.FP_KEY]:
                    bin_num = self.calculate_bin(ex[predicted])
                    if self.bin_in_range(bin_num):
                        self.increment_pred(i, predicted, Histogram.FP_KEY, target, bin_num)
                # self.Histogram_info['HistogramData'][target][self.data_key][self.bin_nums[i][target]][self.fn_key][predicted][self.count_key] += 1
                # self.Histogram_info['HistogramData'][predicted][self.data_key][self.bin_nums[i][predicted]][self.fp_key][target][self.count_key] += 1
                if self.Histogram_info['display'][Histogram.TN_KEY]:
                    for j in range(self.num_classes):
                        bin_num = self.calculate_bin(ex[j])
                        if j != target or j != predicted and self.bin_in_range(bin_num):
                            self.increment_pred(i, j, Histogram.TN_KEY, 0, bin_num)

    def calculate_previous_sum(self):
        maxFN = self.calculate_previous_sum_false_preds_and_max(Histogram.FN_KEY)
        maxFP = self.calculate_previous_sum_false_preds_and_max(Histogram.FP_KEY)
        maxTP = self.calculate_previous_sum_true_preds(Histogram.TP_KEY, Histogram.FP_KEY)
        maxTN = self.calculate_previous_sum_true_preds(Histogram.TN_KEY, Histogram.FN_KEY)
        self.Histogram_info['maxNeg'] = max([maxFN, maxTN])
        self.Histogram_info['maxPos'] = max([maxTP, maxFP])

    def calculate_previous_sum_false_preds_and_max(self, classification_key):
        max_xRange = []
        for data in self.Histogram_info['HistogramData']:
            for bin in data[Histogram.DATA_KEY]:
                for class_num in range(1, self.num_classes):
                    bin[classification_key][class_num][Histogram.PREVIOUS_SUM_KEY] = bin[classification_key][class_num-1][Histogram.PREVIOUS_SUM_KEY] + bin[classification_key][class_num-1][Histogram.COUNT_KEY]
                    if class_num == (self.num_classes - 1):
                        max_xRange.append(bin[classification_key][class_num][Histogram.PREVIOUS_SUM_KEY] + bin[classification_key][class_num][Histogram.COUNT_KEY])
        return max(max_xRange)

    def calculate_previous_sum_true_preds(self, classification_key, prev_classifcation_key):
        max_xRange = []
        for data in self.Histogram_info['HistogramData']:
            for bin in data[Histogram.DATA_KEY]:
                bin[classification_key][0][Histogram.PREVIOUS_SUM_KEY] = bin[prev_classifcation_key][self.num_classes - 1][Histogram.PREVIOUS_SUM_KEY] + bin[prev_classifcation_key][self.num_classes - 1][Histogram.COUNT_KEY]
                max_xRange.append(bin[classification_key][0][Histogram.PREVIOUS_SUM_KEY] + bin[classification_key][0][Histogram.COUNT_KEY])
        return max(max_xRange)

    def bin_in_range(self, bin_num):
        if bin_num >= 0 and bin_num < 10:
            return True
        return False

    def increment_pred(self, instance_num, class_num, class_key, predicted, bin_num):
        #print (self.bin_nums[instance_num][class_num])
        #if self.bin_in_range(self.bin_nums[instance_num][class_num]):
        self.Histogram_info['HistogramData'][class_num][Histogram.DATA_KEY][bin_num][class_key][predicted][Histogram.COUNT_KEY] += 1

    def calculate_bin(self, proba):
        bin_num = int(math.floor((proba - self.Histogram_info['range'][1])/self.Histogram_info['binRange']))
        if bin_num == Histogram.NUM_BINS:
            bin_num -= 1
        return bin_num

    def set_range(self, new_range):
        print(new_range)
        self.Histogram_info['range'] = new_range
        self.create_histogram_data()

    def update_display(self, classification, display):
        if self.Histogram_info['display'][classification] == display:
            self.Histogram_info['display'][classification] = not display
            self.create_histogram_data()
