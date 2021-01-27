const acceptedCharacters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', '#', ','];
const WCAGLevel = {
  AA: 'AA',
  AAA: 'AAA',
};
const Component = {
  NORMAL_TEXT: 'normal text',
  BIG_TEXT: 'big text',
  UI: 'ui',
};
const AAThreshold = {
  NORMAL_TEXT: 4.5,
  BIG_TEXT: 3.0,
  UI: 3.0,
};
const AAAThreshold = {
  NORMAL_TEXT: 7.0,
  BIG_TEXT: 4.5,
  UI: 3.0,
};

// dom elements
let clearTableButton;
let colorMatrix;
let colorPicker;
let colorSelectionForm;
let colorTags;
let colorTagsRow;
let colorValueInput;
let compareColorsButton;
let tableCaption;
let tableRow;

let colorList = [];

let isUpdateTableVisible = true;
let isClearTableVisible = false;


// auto init
init();


// method definitions
function init() {
  tableCaption = document.createElement('caption');
  tableCaption.classList = 'table-caption';
  tableCaption.innerHTML = 'Color Contrast Matrix';

  getDOMElements();
  addEventListeners();
  updateLayout();
}

function getDOMElements() {
  clearTableButton = document.getElementById('clearTableButton');
  colorMatrix = document.getElementById('colorMatrix');
  colorPicker = document.getElementById('colorPicker');
  colorSelectionForm = document.getElementById('colorSelectionForm')
  colorTags = document.getElementById('colorTags');
  colorTagsRow = document.getElementById('colorTagsRow');
  colorValueInput = document.getElementById('colorValueInput');
  tableRow = document.getElementById('tableRow');
  compareColorsButton = document.getElementById('compareColorsButton');
}

function addEventListeners() {
  // color picker
  colorPicker.addEventListener(
    'change',
    event => {
      const { value } = event.target;
      colorValueInput.value = value.toUpperCase();
    }
  );

  // color input
  colorValueInput.addEventListener(
    'blur',
    event => sanitizeColorValueInput()
  );

  // form
  colorSelectionForm.addEventListener(
    'submit',
    event => {
      event.preventDefault();
      event.stopPropagation();

      sanitizeColorValueInput();

      // add colors to list
      const newColors = colorValueInput.value.split(',');
      colorList.push(...newColors);
      colorList = sanitizeColorList(colorList);
      colorList.sort();

      // clear input content
      colorValueInput.value = '';

      // update tag list
      updateColorTags(colorList);

      updateLayout();
    }
  );

  // table
  compareColorsButton.addEventListener(
    'click',
    event => {
      generateTable();
      isClearTableVisible = true;
      updateLayout();
    }
  );
  clearTableButton.addEventListener(
    'click',
    event => {
      colorMatrix.innerHTML = '';
      isClearTableVisible = false;
      updateLayout();
    }
  );

  // color tags
  document.body.addEventListener(
    'click',
    event => {
      const { target } = event;
      const { classList } = target;

      // color tags
      if (classList && classList.contains('close-button')) {
        const { color } = target.dataset;
        const colorIndex = colorList.indexOf(color);

        if (colorIndex > -1) {
          colorList.splice(colorIndex, 1);
          updateColorTags(colorList);
          updateLayout();
        }
      }
    }
  )
}


// dom manipulation
function createColorBlock(color) {
  const element = document.createElement('span');
  element.classList = 'color-block';
  element.style.backgroundColor = color;
  return element;
}

function createColorLabel(color) {
  const label = document.createElement('span');
  label.classList = 'color-label'
  label.innerHTML = color;
  return label;
}

function createColorTag(color) {
  const block = createColorBlock(color);
  const label = createColorLabel(color);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.classList = 'close-button';
  closeButton.dataset.color = color;
  closeButton.innerHTML = '×';

  const element = document.createElement('div');
  element.classList = 'color-tag';
  element.appendChild(block);
  element.appendChild(label);
  element.appendChild(closeButton);

  return element;
}

function createWebAimLink(background, foreground) {
  const link = document.createElement('a');
  link.classList = 'webaim-link';
  link.href = `https://webaim.org/resources/contrastchecker/?fcolor=${foreground}&bcolor=${background}`;
  link.target = '_blank';
  link.innerHTML = 'WebAIM\'s results';
  return link;
}

function generateTable() {
  colorMatrix.innerHTML = '';

  // generate head
  const tr = document.createElement('tr');
  tr.classList = 'table-header-cell';

  // corner cell
  const td = document.createElement('td');
  tr.appendChild(td);

  colorList.forEach(color => {
    const th = document.createElement('th');

    const colorBlock = createColorBlock(color);
    th.appendChild(colorBlock);

    const label = document.createElement('span');
    label.classList = 'color-label'
    label.innerHTML = color;
    th.appendChild(label);

    tr.appendChild(th);
  });

  const thead = document.createElement('thead');
  thead.appendChild(tr);

  // generate other rows
  const tbody = document.createElement('tbody');

  const numColors = colorList.length;

  let row = 0;
  let column = 0;
  colorList.forEach(color => {
    const tr = document.createElement('tr');

    const th = document.createElement('th');
    th.classList = 'table-header-cell';

    const colorBlock = createColorBlock(color);
    th.appendChild(colorBlock);

    const label = document.createElement('span');
    label.classList = 'color-label'
    label.innerHTML = color;
    th.appendChild(label);

    tr.appendChild(th);

    column = 0;
    for (let i = 0; i < numColors; i++) {
      // values
      const ratio = getContrastRatio(colorList[row], colorList[column]);

      const aaValidation = validateContrast({
        ratio,
        level: WCAGLevel.AA,
        component: Component.NORMAL_TEXT,
      });

      // dom elements
      const ratioParagraph = document.createElement('p');
      ratioParagraph.classList = 'contrast-ratio-results';
      ratioParagraph.innerHTML = formatRatio(ratio);

      const validationParagraph = document.createElement('p');
      validationParagraph.classList = 'validation-icon';
      if (aaValidation) {
        validationParagraph.innerHTML = '✔️';
      } else {
        validationParagraph.innerHTML = '❌';
      }

      const link = createWebAimLink(
        colorList[row].substr(1, 6),
        colorList[column].substr(1, 6)
      );

      // build cell
      const td = document.createElement('td');
      if (ratio === 1) {
        td.classList = 'grey-cell';
      } else {
        if (aaValidation) {
          td.classList = 'valid-cell';
        } else {
          td.classList = 'invalid-cell';
        }
      }
      td.appendChild(ratioParagraph);
      td.appendChild(validationParagraph);
      td.appendChild(link);
      tr.appendChild(td);

      column++;
    }

    tbody.appendChild(tr);

    row++;
  });

  colorMatrix.appendChild(tableCaption);
  colorMatrix.appendChild(thead);
  colorMatrix.appendChild(tbody);
}

function toggleVisibility(element, condition) {
  if (condition) {
    element.classList.remove('hidden');
  } else {
    element.classList.add('hidden');
  }
}

function updateColorTags(tagList) {
  colorTags.innerHTML = '';
  tagList.forEach(c => colorTags.appendChild(createColorTag(c)));
}

function updateLayout() {
  const areColorsTagsVisible = colorList.length > 0;
  isUpdateTableVisible = colorList.length > 1;

  toggleVisibility(colorTagsRow, areColorsTagsVisible);
  toggleVisibility(compareColorsButton, isUpdateTableVisible);
  toggleVisibility(clearTableButton, isClearTableVisible);
}


// string methods
// truncates the number to 2 decimal places without rounding
function toTwoDecimals(num) {
  num = String(num);
  if (num.indexOf('.') !== -1) {
    const split = num.split('.');
    if (split.length === 1) {
      return Number(num);
    } else {
      return Number(`${split[0]}.${split[1].charAt(0)}${split[1].charAt(1)}`);
    }
  } else {
    return Number(num);
  }
}

function sanitizeColorValueInput() {
  let response = [];
  let tempArr = colorValueInput.value.toUpperCase();

  // sanitize
  const allChars = tempArr.split('');
  tempArr = [];
  allChars.forEach(char => {
    if (acceptedCharacters.indexOf(char) !== -1) {
      tempArr.push(char);
    }
  });
  const tempStr = tempArr.join('');

  // validate colors
  const allEntries = tempStr.split(',');
  allEntries.forEach(entry => {
    const re = /^#([a-fA-F0-9]{6})$/
    if (re.test(entry)) {
      response.push(entry);
    }
  });

  colorValueInput.value = response;
}

function sanitizeColorList(list) {
  // ensure values are hex
  const validEntries = [];
  list.forEach(listItem => {
    const re = /^#([a-fA-F0-9]{6})$/
    if (re.test(listItem)) {
      validEntries.push(listItem);
    }
  });

  // ensure no duplicates
  let uniqueEntries = validEntries.filter(
    (c, index) => validEntries.indexOf(c) === index
  );

  return uniqueEntries;
}


// contrast methods
// adapted from https://webaim.org/resources/contrastchecker/
function getContrastRatio(background, foreground) {
  const L1 = getL(foreground);
  const L2 = getL(background);
  const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  return ratio;
}

function formatRatio(ratio) {
  return toTwoDecimals((ratio * 100) / 100) + ':1';
}

function getL(c) {
  return (0.2126 * getsRGB(c.substr(1, 2)) + 0.7152 * getsRGB(c.substr(3, 2)) + 0.0722 * getsRGB(c.substr(-2)));
}

function getRGB(c) {
  try {
    var c = parseInt(c, 16);
  } catch (err) {
    var c = false;
  }
  return c;
}

function getsRGB(c) {
  c = getRGB(c) / 255;
  c = (c <= 0.03928) ? c / 12.92 : Math.pow(((c + 0.055) / 1.055), 2.4);
  return c;
}

function validateContrast(options) {
  const { ratio, level, component } = options;

  let response = false;

  switch (component) {
    case Component.NORMAL_TEXT:
      if (level === WCAGLevel.AA) {
        response = (ratio >= AAThreshold.NORMAL_TEXT);
      } else if (level === WCAGLevel.AAA) {
        response = (ratio >= AAAThreshold.NORMAL_TEXT);
      }
      break;

    case Component.BIG_TEXT:
      if (level === WCAGLevel.AA) {
        response = (ratio >= AAThreshold.BIG_TEXT);
      } else if (level === WCAGLevel.AAA) {
        response = (ratio >= AAAThreshold.BIG_TEXT);
      }
      break;

    case Component.UI:
      if (level === WCAGLevel.AA) {
        response = (ratio >= AAThreshold.UI);
      } else if (level === WCAGLevel.AAA) {
        response = (ratio >= AAAThreshold.UI);
      }
      break;
  }

  return response;
}
