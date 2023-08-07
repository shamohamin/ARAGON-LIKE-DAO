from flask import Flask
from flask import request
from flask import jsonify
from typing import Any
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)


DEFAULT_DATA_KEYS = 'contract'

def checkDataFromat(content: Any) -> str:
    if type(content) is not dict:
        raise Exception("Content needs to be dictionary")

    contentKeys = content.keys()

    if not DEFAULT_DATA_KEYS in contentKeys:
        raise Exception(f"{DEFAULT_DATA_KEYS} needs to be present in the data.")
    
    contract = content.get(DEFAULT_DATA_KEYS)
    return contract

def createContractFormat(contractStr: str) -> str:
    librsFilePath = os.path.join(os.path.dirname(__file__), 'TokenBuild', 'src', 'lib.rs')
    print(librsFilePath)
    with open(librsFilePath, 'w') as file:
        file.write(contractStr)

    return librsFilePath

def compileContract():
    srcPath = os.path.join(os.path.dirname(__file__), 'TokenBuild')
    
    os.system(f'cd {srcPath} && cargo partisia-contract build --release')

@app.route('/build', methods=['POST'])
def buildContract():
    content = request.get_json()
    try:
        contract = checkDataFromat(dict(content))
        _ = createContractFormat(contract)
        compileContract()
    except Exception as ex:
        return jsonify({'message': ex.args[1]}, 400)
    
    return jsonify({'message': 'ok'}, 200)



if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=True)