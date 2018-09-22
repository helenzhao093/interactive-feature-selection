class Feature(object):
    class Type:
        CLASS = 'CLASS'
        ID = 'ID'
        BINARY = 'BINARY'
        NOMINAL = 'NOMINAL'
        CONTINUOUS = 'CONTINUOUS'

    def __init__(self, name, ftype, values=None):
        self.info = dict()
        self.info['name'] = name
        self.info['type'] = ftype
        if (self.type == Feature.Type.ID or
            self.type == Feature.Type.NOMINAL):
            if values is None:
                raise Exception('No values for %s feature' % self.type)
            else:
                self.values = tuple(values)
        else:
            if values is None:
                self.values = None
            else:
                raise Exception('Values given for % feature' % self.type)
        self.tup = (self.name, self.type, self.values)

    def to_float(self, value):
        if value is None:
            return None
        if (self.type == Feature.Type.ID or
            self.type == Feature.Type.NOMINAL):
            return float(self.values.index(value))
        elif (self.type == Feature.Type.BINARY or
              self.type == Feature.Type.CLASS):
            if value: return 1.0
            else:     return 0.0
        else:
            return value

def parse_features(feature_filename):
    features = []
    with open(feature_filename) as feature_file:
        for line in feature_file:
            feature = parse_feature(line)
            if feature is not None:
                features.append(feature)
    print features[0]
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
        set_ftype_values('continous', [], feature_data)
    elif len(values) == 2 and '0' and '1' in values:
        set_ftype_values('continous', [], feature_data)
    else:
        set_ftype_values('continous', [], feature_data)
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
        values.append(raw)
    return values
