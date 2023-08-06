from flask import Flask
from flask import request
from flask import jsonify
from typing import Any

app = Flask(__name__)


DEFAULT_DATA_KEYS = 'contract'

def checkDataFromat(content: Any):
    if type(content) is not dict:
        raise Exception("Content needs to be dictionary")

    contentKeys = content.keys()

    if not DEFAULT_DATA_KEYS in contentKeys:
        raise Exception(f"{DEFAULT_DATA_KEYS} needs to be present in the data.")
    
    contract = content.get(DEFAULT_DATA_KEYS)

    print(contract)


@app.route('/build', methods=['POST'])
def buildContract():
    content = request.get_json()
    try:
        checkDataFromat(dict(content))
    except Exception as ex:
        return jsonify({'message': ex.args[1]}, 400)



if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)