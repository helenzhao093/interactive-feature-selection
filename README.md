# Interactive Feature Selection (IFS)
Interactive feature selection is a web application that involves the user in the feature selection preprocessing step in the machine learning process. Common automated feature selection algorithms search the space of feature subsets by optimizing a criterion function. Automated algorithms lack transparency and may output feature sets that are predictive of the training data but not of the underlying data generating mechanisms.

IFS incorporates the human expert who understands the classification problem domain and the semantics of the input data. The IFS workflow includes:
1. the user visually ranks the features by importance and expresses causal relationships among the features. 
2. The application visualizes the user's inputs, provides analytics, and visualizes the dataset using parallel coordinates. 
3. The user interactively selects a feature subset to build a model. 
4. The user uses the visualization of the traing results to iteratively select feature subsets and generate high performing and more transparent models. 

![Feature Importance](./images/FeatureImportance.png)

![Causal Graph](./images/CausalGraph.png)

![Feature Selection](./images/ParallelCoordinates.png)

![Performance Analysis](./images/PerformanceAnalysis.png)

