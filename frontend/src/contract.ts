import { TokenUtility } from "./Token";
// import axios from 'axios';


enum ContratType {
    NONE = "none",
    TOKEN = "token"
}

enum viewType {
    IMPORTS = "IMPORTS",
    STATES = "STATES",
    ACTIONS = "ACTIONS"
}

let StateHolder = {
    "none": null,
    "token": new TokenUtility.Token(),
};

class HandelView<T extends null | {
    getImports(): Array<string>,
    addToImport(import_val: string): void,
    deleteFromImports(import_val: string): void,
    tokenState(): [[string, string]],
    addState(stateName: string, stateType: string): void,
    removeState(stateName: string): void,
    pushAction(index: number): void,
    removeAction(index: number): void,
    buildContract(): string
}> {
    private importViewID = 'import-view';
    private stateViewID = 'state-view';
    private actionsViewID = 'actions-view';
    private importView: HTMLDivElement;
    private stateView: HTMLDivElement;
    private actionView: HTMLDivElement;

    public constructor(public instance: T) {
        this.instance = instance;

        this.importView = document.getElementById(this.importViewID)! as HTMLDivElement;
        this.stateView = document.getElementById(this.stateViewID)! as HTMLDivElement;
        this.actionView = document.getElementById(this.actionsViewID)! as HTMLDivElement;
    }

    private AddBtnCreation(parent: HTMLDivElement, label: viewType) {
        const AddBtn = document.createElement('button') as HTMLButtonElement;
        AddBtn.classList.add('btn-circle');
        AddBtn.classList.add('btn-add');
        AddBtn.innerHTML = '+'
        parent.append(AddBtn);
        AddBtn.onclick = () => {
            this.addItemView(AddBtn, label);
        }
    }

    public initializeView() {
        this.resetView();
        if (this.instance === null) { return; };

        this.createTitle(this.importView, 'Imports');
        this.instance!.getImports().forEach((import_val) => {
            const divContainer = document.createElement('div');
            const inputContainer = document.createElement('input') as HTMLInputElement;
            inputContainer.type = 'text';
            inputContainer.disabled = true;
            divContainer.append(inputContainer);
            inputContainer.value = `${import_val}`;
            this.importView.append(divContainer);
        })
        this.AddBtnCreation(this.importView, viewType.IMPORTS);
        this.createHR(this.importView);

        this.createTitle(this.stateView, 'States');
        this.instance!.tokenState().forEach(value => {
            const [varName, varType] = value;
            const divContainer = document.createElement('div');
            const inputContainerName = document.createElement('input') as HTMLInputElement;
            inputContainerName.type = 'text';
            inputContainerName.disabled = true;
            const inputContainerType = document.createElement('input') as HTMLInputElement;
            inputContainerType.type = 'text';
            inputContainerType.disabled = true;
            inputContainerName.value = varName; inputContainerType.value = varType;

            divContainer.append(inputContainerName); divContainer.append(inputContainerType);
            this.stateView.append(divContainer);
        })
        this.AddBtnCreation(this.stateView, viewType.STATES)
        this.createHR(this.stateView)


        this.createTitle(this.actionView, 'Actions');
        TokenUtility.tokenActions.forEach((action, index: number) => {
            const divContainer = document.createElement('div');
            const spanIndicator = document.createElement('span')
            spanIndicator.innerHTML = '*';
            spanIndicator.style.marginRight = '3px';
            spanIndicator.style.fontSize = '2rem';

            const inputContainerName = document.createElement('input') as HTMLInputElement;
            inputContainerName.type = 'text';
            inputContainerName.disabled = true;
            inputContainerName.value = action.actionName;

            const addBtn = document.createElement('button');
            addBtn.innerHTML = '+';
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '-';

            addBtn.classList.add('button-35');
            removeBtn.classList.add('button-35');

            addBtn.onclick = () => {
                this.instance!.pushAction(index);
                spanIndicator.style.display = 'none';
            }
            removeBtn.onclick = () => {
                this.instance!.removeAction(index);
                spanIndicator.style.display = 'flex'
            }


            divContainer.append(spanIndicator);
            divContainer.append(inputContainerName);
            divContainer.append(addBtn);
            divContainer.append(removeBtn);
            this.actionView.append(divContainer);
        })
        this.createHR(this.actionView);

        document.getElementById('build')!.style.display = 'flex';
        document.getElementById('build')!.onclick = async () => {
            const contractString = this.instance!.buildContract();
            const res = await axios.post('http://localhost:5000/build',
                { contract: contractString }, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
            })
            console.log(res);
        }
    }

    private createTitle(parent: HTMLDivElement, title: string) {
        const divContainer = document.createElement('div');
        const h1Title = document.createElement('h1');
        h1Title.innerHTML = title;
        divContainer.append(h1Title);
        parent.append(divContainer);
    }


    private createHR(parent: HTMLDivElement) {
        const divContainer = document.createElement('div');
        const hr = document.createElement('hr');
        hr.style.color = 'black';
        hr.style.width = '90%';
        hr.style.borderTop = '1px solid black';
        divContainer.append(hr);
        parent.append(divContainer);
    }

    private resetView() {
        const containers = [this.importView, this.stateView, this.actionView];
        containers.forEach(container => {
            while (container.firstChild) {
                container.firstChild.remove();
            }
        })
    }

    private makeAddContainer(parent: HTMLDivElement, itemLabel: viewType) {
        if (itemLabel === viewType.IMPORTS) {
            const div1 = document.createElement('div');
            const div2 = document.createElement('div');
            const div3 = document.createElement('div');
            const inputContainer = document.createElement('input') as HTMLInputElement;
            inputContainer.type = 'text';
            div1.append(inputContainer);
            const submitBtn = document.createElement('button') as HTMLButtonElement;
            submitBtn.innerHTML = 'SUBMIT';
            submitBtn.onclick = () => this.addItemToParts(itemLabel, inputContainer, submitBtn);
            submitBtn.classList.add('button-35');
            div2.append(submitBtn);
            const removeBtn = document.createElement('button') as HTMLButtonElement;
            removeBtn.onclick = () => this.deleteItemFromParts(itemLabel, inputContainer, parent);
            removeBtn.innerHTML = 'DELETE'
            removeBtn.classList.add('button-35');
            div3.append(removeBtn);

            parent.append(div1)
            parent.append(div2)
            parent.append(div3)
        } else if (itemLabel === viewType.STATES) {
            const div1 = document.createElement('div');
            const div2 = document.createElement('div');
            const div3 = document.createElement('div');
            const inputContainer1 = document.createElement('input') as HTMLInputElement;
            const inputContainer2 = document.createElement('input') as HTMLInputElement;
            inputContainer2.id = 'inp-type';
            inputContainer1.type = 'text';
            inputContainer1.placeholder = 'state name'
            div1.append(inputContainer1);
            inputContainer2.type = 'text';
            inputContainer2.placeholder = 'state type';
            div1.append(inputContainer2);
            const submitBtn = document.createElement('button') as HTMLButtonElement;
            submitBtn.innerHTML = 'SUBMIT'
            submitBtn.onclick = () => this.addItemToParts(itemLabel, inputContainer1, submitBtn);
            submitBtn.classList.add('button-35')
            div2.append(submitBtn);
            const removeBtn = document.createElement('button') as HTMLButtonElement;
            removeBtn.onclick = () => this.deleteItemFromParts(itemLabel, inputContainer1, parent);
            removeBtn.innerHTML = 'DELETE'
            removeBtn.classList.add('button-35');
            div3.append(removeBtn);

            parent.append(div1)
            parent.append(div2)
            parent.append(div3)
        }
    }

    /*
        This 
    */
    public addItemView(btn: HTMLButtonElement, itemLabel: viewType) {
        const divContainer = document.createElement('div');
        divContainer.classList.add('created');
        if (itemLabel === viewType.IMPORTS) {
            // const divContainer = document.createElement('div');
            // divContainer.classList.add('created');
            this.makeAddContainer(divContainer, itemLabel);
            this.importView.insertBefore(divContainer, btn);
        } else if (itemLabel === viewType.STATES) {
            this.makeAddContainer(divContainer, itemLabel);
            this.stateView.insertBefore(divContainer, btn);
        }
    }

    public deleteItemFromParts(partLabel: viewType, inputElement: HTMLInputElement, parentOfInput: HTMLDivElement) {
        const trimmedVal = inputElement.value.trim();

        if (partLabel === viewType.IMPORTS) {
            this.instance!.deleteFromImports(trimmedVal);
            inputElement.disabled = true;
        } else if (partLabel === viewType.STATES) {
            this.instance!.removeState(trimmedVal);
        }

        parentOfInput.remove();
    }

    public addItemToParts(partLabel: viewType, inputElement: HTMLInputElement, submitBtn: HTMLButtonElement) {
        const trimmedVal = inputElement.value.trim();

        if (trimmedVal === "") {
            alert('value of the text is needed');
            return;
        }

        if (partLabel === viewType.IMPORTS) {
            this.instance!.addToImport(trimmedVal);
        } else if (partLabel === viewType.STATES) {
            const typeOfState = document.getElementById('inp-type') as HTMLInputElement;
            if (typeOfState) {
                if (typeOfState.value === "") {
                    alert('a value for type is requied!');
                    return;
                }
                this.instance!.addState(trimmedVal, typeOfState.value.trim());
                typeOfState.disabled = true;
            }
        }
        inputElement.disabled = true;

        submitBtn.remove();
    }

}


function optionOnChange(elem: HTMLSelectElement) {
    const index = elem.selectedIndex;
    const selectedValue = elem.options[index].value as string;

    switch (selectedValue.trim()) {
        case ContratType.NONE:
            new HandelView(null).initializeView(); break;
        case ContratType.TOKEN:
            new HandelView(StateHolder.token).initializeView(); break;
        default:
            break;
    }

}

window.onload = () => {
    document.getElementById('ct')!.onchange = () => {
        optionOnChange(document.getElementById('ct') as unknown as HTMLSelectElement)
    }

    StateHolder.token.tokenState()
}