export interface Ball {
    x: number;
    y: number;
    
    hidden: boolean;
    isProjectile: boolean;

    direction: number;
    startSpeed: number;
}