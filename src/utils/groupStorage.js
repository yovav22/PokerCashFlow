const GROUP_ID_KEY = 'selectedGroupId';
const GROUPS_KEY = 'groups';

export const getSelectedGroupId = () => {
  return parseInt(localStorage.getItem(GROUP_ID_KEY));
};

export const setSelectedGroupId = (groupId) => {
  localStorage.setItem(GROUP_ID_KEY, groupId);
};

export const getGroups = () => {
  const groupsStr = localStorage.getItem(GROUPS_KEY);
  return groupsStr ? JSON.parse(groupsStr) : [];
};

export const setGroups = (groups) => {
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}; 

export const getCurrentGroup = () => {
    const group = getSelectedGroupId()
    const groups = getGroups();
    return groups.find(g => g.id === group);
}; 