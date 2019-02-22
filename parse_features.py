def parse_description(des_filename):
    des = dict()
    with open(des_filename) as des_file:
        for line in des_file:
            line = line.strip() # get rid of space
            colon = line.find(':')
            name = line[:colon].strip()
            reminder = line[colon+1:].strip()
            des[name] = reminder
    return des

def parse_features(feature_filename):
    features = []
    with open(feature_filename) as feature_file:
        for line in feature_file:
            feature = parse_feature(line)
            if feature is not None:
                features.append(feature)
    # print features[0]
    return features

def parse_feature(line):
    feature_data = dict()
    line = line.strip() #get rid of space
    if len(line) > 0 and line[-1] == '.':
        line = line[:-1].strip()
    colon = line.find(':')
    name = line[:colon].strip()
    remainder = line[colon + 1:]
    values = parse_values(remainder)
    feature_data['name'] = name
    if len(values) == 1 and values[0].startswith('continuous'):
        set_ftype_values('continuous', [], feature_data)
    #elif len(values) == 2 and '0' and '1' in values:
    #    set_ftype_values('continuous', [0,1], feature_data)
    else:
        set_ftype_values('nominal', values, feature_data)
    return feature_data

def set_ftype_values(type, values, feature_data):
    feature_data['type'] = type
    feature_data['values'] = values

def parse_values(value_string):
    values = list()
    for raw in value_string.split(','):
        raw = raw.strip()
        if len(raw) > 1 and raw[0] == '"' and raw[-1] == '"':
            raw = raw[1:-1].strip()
        try:
            raw = int(raw)
        except ValueError:
            raw = raw
        values.append(raw)
    #print values
    return values
