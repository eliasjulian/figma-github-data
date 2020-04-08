import { isFramelikeNode, getRandomElementFromArray, selectionContainsSettableLayers } from './utils';
import { users, orgs, repos, config } from './data';
import transformNodeWithData from './transformNodeWithData';

function appendUrlWithVariable(variable, arr) {
  return variable ? variable : getRandomElementFromArray(arr);
}

export function getDataFromAPI(route) {
  route += '?access_token=2241c241b216081f9b6dfb7871a11a53';
  figma.ui.postMessage({ type: 'networkRequest', route: route });
  return new Promise((res) => {
    figma.ui.once('message', (resource) => {
      return res(resource);
    });
  });
}

async function getBonus(variable) {
  let route = config.apiRoot + `/bonuses`;
  //route += appendUrlWithVariable(variable, users)

  return await getDataFromAPI(route);
}

async function getOrg(variable) {
  let route = config.apiRoot + `/users/`;
  route += appendUrlWithVariable(variable, orgs);

  return await getDataFromAPI(route);
}

async function getRepo(variable) {
  let route = config.apiRoot + `/repos/`;
  route += appendUrlWithVariable(variable, repos);

  return await getDataFromAPI(route);
}

async function fetchAndPopulate(type, variable) {
  switch (type) {
    case 'bonus': {
      return await getBonus(variable);
    }
    case 'org': {
      return await getOrg(variable);
    }
    case 'repo': {
      return await getRepo(variable);
    }
  }
}

async function populateOneNode(type, variable, selection, bonusData) {
  const curr = selection as FrameNode | InstanceNode | ComponentNode;

  // if the user selected a framelike node...
  if (isFramelikeNode(curr)) {
    // ...that only contains children that are framelike, they are probably
    // trying to populate a list of elements with data
    const nodes = curr.children;
    for (let node of nodes) {
      transformNodeWithData(node, bonusData);
    }
  }
}

async function temporaryFunction(type, variable, result, selection) {
  const listOfBonuses = result.result;
  selection.forEach((node, index) => {
    populateOneNode(type, variable, node, listOfBonuses[index]);
  });
}

export default async function populateSelectionWithData({ type, variable }) {
  const selection = figma.currentPage.selection;
  if (!selection || selection.length === 0) return figma.notify('No selection');

  await fetchAndPopulate(type, variable).then(
    async (result) => await temporaryFunction(type, variable, result, selection)
  );
}
