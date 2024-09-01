const scriptProperties = PropertiesService.getScriptProperties();

const personData = {
    'Kevin Hwang': '1',
    'Bob': '2',
    'Charlie': '3',
    'David': '4',
    'Eve': '5',
    'Frank': '6',
    'Grace': '7',
    'Hannah': '8',
    'Ivy': '9',
    'Jack': '10'
  };

export const setProperties = () => {
  scriptProperties.setProperties(personData);
  console.log('Grabbing set script properties',scriptProperties.getProperties());
  console.log('Grabbing Kevin Hwang', scriptProperties.getProperty('Kevin Hwang'));
}

export const useProperties = () => {
  console.log('Using set script properties', scriptProperties.getProperties());
}