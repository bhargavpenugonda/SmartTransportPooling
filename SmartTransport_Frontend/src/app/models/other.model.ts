export interface Rating {
  id: number;
  ratedBy: { id: number; name: string };
  ratedUser: { id: number; name: string };
  trip: { id: number };
  score: number;
  comment: string;
  createdAt: string;
}

export interface RatingRequest {
  tripId: number;
  ratedUserId: number;
  score: number;
  comment: string;
}

export interface Organization {
  id: number;
  name: string;
  emailDomain: string;
  whitelisted: boolean;
  createdAt: string;
}

export interface OrganizationRequest {
  name: string;
  emailDomain: string;
  whitelisted: boolean;
}
