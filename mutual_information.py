from sklearn.metrics import mutual_info_score
from sklearn.preprocessing import normalize
import numpy as np
import math

#X = features [examples x dimensions]


#X = np.around(X, )


def cal_MI(examples, feature_index, Y):
    Y = np.asarray(Y)
    X = normalize(examples)
    X = np.around(X, 10)
    S = []
    MI = 0
    total_count = len(Y) + 0.0
    Y_values = set(Y)
    for i in feature_index:
        Xi = [d[i] for d in X]
        MI += cal_MI_xi_xj(i, -1, Xi, Y, X, total_count)
        for j in S:
            Xj = [d[j] for d in X]
            MI -= cal_MI_xi_xj(i, j, Xi, Xj, X, total_count)
            MI += cal_cond_MI_xi_xj(i, j, X, Y, Y_values, total_count)
        S.append(i)
    print MI
    return MI

def cal_MI_xi_xj(i, j, Xi, Xj, X, total_count):
    MI = 0
    Xi_values = set(Xi)
    Xj_values = set(Xj)
    p_xi = []
    for xi in Xi_values:
        #p_xi.append([X[i]-xi < 1e-10].sum()/total_count)
        p_xi.append((Xi-xi == 0).sum()/total_count)
    for xj in Xj_values:
        #(Xj-xi < 1e-10)
        if j > 0:
            xj_cond = X[X[:,j]-xj == 0, :]
        else:
            xj_cond = X[Xj == xj]
        p_xj = xj_cond.shape[0]/total_count
        if p_xj > 0:
            for k, xi in enumerate(Xi_values):
                xi_xj_cond = xj_cond[xj_cond[:,i] - xi == 0, :]
                p_xi_xj = xi_xj_cond.shape[0]/total_count
                if p_xi_xj > 0:
                    #p_xi_xj = xi_xj_count/total_count
                    #p_xj = xj_cond.shape[0]/total_count
                    #print p_xi_xj, p_xj, p_xi[k]
                    if p_xi[k] > 0:
                        MI += p_xi_xj * np.log2((p_xi_xj/p_xi[k])/p_xj)
    print MI
    return MI

def cal_cond_MI_xi_xj(i, j, X, Y, Y_values, total_count):
    cond_MI = 0
    for y in Y_values:
        y_cond = X[Y == y]
        count_y = y_cond.shape[0] + 0.0
        Xi_values = set([d[i] for d in y_cond])
        Xj_values = set([d[j] for d in y_cond])

        p_xj_y = []
        for xj in Xj_values:
            xj_y_cond = y_cond[y_cond[:,j] - xj == 0, :]
            #print xj_y_cond.shape[0]/count_y
            p_xj_y.append(xj_y_cond.shape[0]/count_y)

        for xi in Xi_values:
            xi_y_cond = y_cond[y_cond[:,i] - xi == 0, :]
            p_xi_y = xi_y_cond.shape[0]/count_y
            if p_xi_y > 0:
                for k, xj in enumerate(Xj_values):
                    if p_xj_y[k] > 0:
                        xj_xi_y_cond = xi_y_cond[xi_y_cond[:,j] - xj == 0, :]
                        p_xj_xi_y_cond = xj_xi_y_cond.shape[0]/total_count
                        p_xj_xi_y_given_y = xj_xi_y_cond.shape[0]/count_y
                        #count_xj = xj_y_cond.shape[0]
                        #count_xi_xj = xj_xi_y_cond.shape[0]
                        if p_xj_xi_y_cond > 0 and p_xj_xi_y_given_y > 0:
                            #p_xj_xi_y = count_xi_xj/total_count
                            #p_xi_xj_given_y = count_xi_xj/count_y
                            #p_xi_y = count_xi/count_yp_xj_xi_y_given_y
                            #print p_xj_xi_y_cond, p_xj_xi_y_given_y, p_xj_y[k], p_xi_y
                            cond_MI += p_xj_xi_y_cond * np.log2((p_xj_xi_y_given_y/p_xj_y[k])/p_xi_y)
    print cond_MI
    return cond_MI

def calculate_MI(examples, feature_index, Y):
    Y = np.asarray(Y)
    X = normalize(examples)
    X = np.around(X, 10)
    X = np.column_stack((X, Y))
    S = []
    MI = 0
    total_count = len(Y) + 0.0
    Y_values = set(Y)
    for i in feature_index:
        MI += calculate_MI_Xi_Xj(X, i, -1, total_count, total_count)
        for j in S:
            Xj = [d[j] for d in X]
            MI -= calculate_MI_Xi_Xj(X, i, j, total_count, total_count)
            for y in Y_values:
                X_condy = X[X[:,-1] == y, :]
                print X_condy.shape
                MI += calculate_MI_Xi_Xj(X_condy, i, j, total_count, X_condy.shape[0])
        S.append(i)
    print MI
    return MI

# input array 2 columns of values sorted
def calculate_MI_Xi_Xj(X, i, j, total_count, cond_count):
    # sort xi and x
    # doesnt work cant calculate Xj count correctly
    Xj_value_count = calculate_xj_value_count(X, j)
    X_sorted = X[np.lexsort((X[:,j], X[:,i]))]#X[X[:,i].argsort()]
    MI = 0.0
    xi_cur = X_sorted[0][i]
    xj_cur = X_sorted[0][j]
    xi_count = calculate_value_count(X_sorted, i, xi_cur, 0)
    xi_xj_count = 1.0
    for k in range(1, len(X_sorted)):
        if X_sorted[k][i] == xi_cur and X_sorted[k][j] == xj_cur:
            xi_xj_count += 1
        else:
            xj_count = Xj_value_count[xj_cur]
            #print xi_xj_count, xi_count, xj_count, cond_count
            MI += (xi_xj_count/total_count) * np.log2((xi_xj_count/cond_count)/(xi_count/cond_count)/(xj_count/cond_count))
            if X_sorted[k][j] != xj_cur:
                xj_cur = X_sorted[k][j]
            if X_sorted[k][i] != xi_cur:
                xi_cur = X_sorted[k][i]
                xi_count = calculate_value_count(X_sorted, i, xi_cur, k)
            xi_xj_count = 1.0
    xj_count = Xj_value_count[xj_cur]
    MI += (xi_xj_count/total_count) * np.log2((xi_xj_count/cond_count)/(xi_count/cond_count)/(xj_count/cond_count))
    #print MI
    return MI

def calculate_xj_value_count(X, j):
    Xj_value_count = dict()
    for i in range(0, len(X)):
        if X[i][j] in Xj_value_count.keys():
            Xj_value_count[X[i][j]] += 1.0
        else:
            Xj_value_count[X[i][j]] = 1.0
    return Xj_value_count

def calculate_value_count(X, i, xi, k):
    count = 0.0
    while k < len(X) and X[k][i] == xi:
        count += 1
        k += 1
    return count
