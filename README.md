# ARAGON-LIKE-DAO

## Initialization

```

Frontend
  - under frontend folder run 'npm compile' or 'tsc -w'
  - under frontend/dist/contract.js change the ' import { TokenUtility } from "./Token " ' to import { TokenUtility } from "./Token.js" ';
  - under frontend/dist/contract.js comment "import axios from 'axios'";
  - the reason for changing these are I did not make a bundle from my typescript files. Therefore, these issues need to be manually handled. 
  - run a http server  'npm install . && npm start';

Backend
  - pip install -u flask flask-cors
  - python main.py

requirements:
  - install rust and cargo-rust   
