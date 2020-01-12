import math

class InstanceClassification:
    TP_INDEX = 0
    TN_INDEX = 1
    FP_INDEX = 2
    FN_INDEX = 3
    NUM_CLASSIFICATION = 4
    def __init__(self, predicted, target):
        self.predicted = predicted
        self.target = target
        self.instance_classification = dict()

    def init_classification_map():
        for i in len(predicted):
            self.instance_classification[i] = [0] * NUM_CLASSIFICATION
            target = self.target[i][0]
            predicted = self.predicted[i][0]
            if target == predicted: #tp
                self.instance_classification[i][TP_INDEX] = True
            #if target != predicted:
            #    self.instance_classification[i][FP_INDEX] = 
