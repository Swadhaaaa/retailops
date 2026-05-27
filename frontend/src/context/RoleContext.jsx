import { createContext, useState } from 'react';

export const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const [selectedSubRole, setSelectedSubRole] = useState(null);

  return (
    <RoleContext.Provider value={{ selectedSubRole, setSelectedSubRole }}>
      {children}
    </RoleContext.Provider>
  );
};
