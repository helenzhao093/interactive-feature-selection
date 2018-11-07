from sklearn.naive_bayes import GaussianNB
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import precision_score
from sklearn.metrics import recall_score
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import cross_val_predict
import pandas as pd
import numpy as np

# read datafile with features + target in last column
class Classifier:
    def __init__(self, filename):
        self.df = pd.read_csv(filename)
        self.clf = GaussianNB()
        self.accuracy = 0
        self.precision = 0
        self.recall = 0
        # classify :
        # input is array of feature names
    def classify(self, feature_names):
        X, y = self.get_X_and_y(feature_names)

        skf = StratifiedKFold(n_splits=5)
        skf.get_n_splits(X, y)
        accurary = []
        precision = []
        recall = []
        for train_index, test_index in skf.split(X, y):
            #print("TRAIN:", train_index, "TEST:", test_index)
            X_train, X_test = X[train_index], X[test_index]
            y_train, y_test = y[train_index], y[test_index]
            self.clf.fit(X_train, y_train)
            accurary.append(self.clf.score(X_test, y_test))
            y_pred = self.clf.predict(X_test)
            precision.append(precision_score(y_test, y_pred, average='weighted'))
            recall.append(recall_score(y_test, y_pred, average='weighted'))
        self.predicted = cross_val_predict(self.clf, X, y, cv=skf)
        self.proba = cross_val_predict(self.clf, X, y, cv=skf, method='predict_proba')
        self.init_confusion_matrix(y, self.predicted)
        #print self.predictions
        self.set_average_scores(accurary, precision, recall)

    def init_confusion_matrix(self, y_true, y_pred):
        self.cm = confusion_matrix(y_true, y_pred)
        self.cm_normalized = self.cm.astype('float')/self.cm.sum(axis=1)[:, np.newaxis]
        #print self.cm_normalized

    def set_average_scores(self, accuracy, precision, recall):
        self.accuracy = self.get_average(accuracy)
        self.precision = self.get_average(precision)
        self.recall = self.get_average(recall)

    def get_average(self, scores):
        return sum(scores)/len(scores)

    def get_X_and_y(self, feature_names):
        X = self.df.loc[:, feature_names]
        y = self.df.loc[:, 'CLASS']
        X = X.as_matrix()
        y = y.as_matrix()
        return X, y
