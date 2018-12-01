from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import precision_score
from sklearn.metrics import recall_score
from sklearn.metrics import confusion_matrix
from sklearn.model_selection import cross_val_predict
from sklearn.model_selection import cross_val_score
from sklearn import preprocessing
import pandas as pd
import numpy as np

# read datafile with features + target in last column
class Classifier:
    def __init__(self, filename, class_name):
        self.df_og = pd.read_csv(filename)
        self.clf = KNeighborsClassifier(3)
        self.accuracy = 0
        self.precision = 0
        self.recall = 0
        self.class_name = class_name
        self.process_discrete_features()
        # classify :
        # input is array of feature names

    def process_discrete_features(self):
        numeric_data = []
        self.les = {}
        column_names = list(self.df_og.columns.values)
        for feature in column_names:
            print self.df_og[feature].dtype
            if self.df_og[feature].dtype != 'int64' or self.df_og[feature].dtype != 'float64':
                le = preprocessing.LabelEncoder()
                le.fit(np.sort(self.df_og[feature].unique()))
                numeric_data.append(le.transform(self.df_og[feature]))
                self.les[feature] = le
            else:
                numeric_data.append(list(self.df_og[feature]))
        self.df = pd.DataFrame(np.asarray(numeric_data).T, columns=column_names)
        #print self.df.iloc[0]

    def classify(self, feature_names):
        print feature_names
        X, y = self.get_X_and_y(feature_names)
        skf = StratifiedKFold(n_splits=5)
        skf.get_n_splits(X, y)
        accurary = cross_val_score(self.clf, X, y, cv=skf)
        precision = []
        recall = []
        for train_index, test_index in skf.split(X, y):
            #print("TRAIN:", train_index, "TEST:", test_index)
            X_train, X_test = X[train_index], X[test_index]
            y_train, y_test = y[train_index], y[test_index]
            self.clf.fit(X_train, y_train)
            #accurary.append(self.clf.score(X_test, y_test))
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
        y = self.df.loc[:, self.class_name]
        X = X.as_matrix()
        y = y.as_matrix()
        return X, y
