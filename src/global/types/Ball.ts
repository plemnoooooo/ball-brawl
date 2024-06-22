export interface Ball {
    x: number;
    y: number;
    
    isProjectile: boolean;
    owner: string;
    direction: number;
    startSpeed: number;
}