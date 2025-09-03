export interface Skill {
  id: number;
  name: string;
  category: string;
  color: string;
}

export interface UserSkill {
  id: number;
  skill: Skill;
  proficiencyLevel: ProficiencyLevel;
}

export enum ProficiencyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT'
}

export interface AddUserSkillRequest {
  skillId: number;
  proficiencyLevel: ProficiencyLevel;
}