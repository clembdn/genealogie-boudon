export type PersonNodeData = {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  deathDate?: string;
  photoUrl?: string;
};

export type FamilyNodeType =
  | 'INITIAL'
  | 'PERSON'
  | 'UNION'
  | 'FAMILY_BOX';

export type RelationType =
  | 'PARENT_CHILD'
  | 'SPOUSE'
  | 'EX_SPOUSE'
  | 'PARTNER'
  | 'ADOPTIVE_PARENT'
  | 'UNKNOWN_PARENT';
