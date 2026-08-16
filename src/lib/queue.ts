import type { Token, TokenPriority, TokenStatus } from "@/types/database";

const ACTIVE_STATUSES: TokenStatus[] = ["waiting", "called"];

export function getPeopleAhead(tokens: Token[], currentTokenId: string) {
  const currentToken = tokens.find((token) => token.id === currentTokenId);

  if (!currentToken) {
    return 0;
  }

  return tokens.filter(
    (token) =>
      ACTIVE_STATUSES.includes(token.status) &&
      token.token_number < currentToken.token_number,
  ).length;
}

export function getEstimatedWaitRange(
  peopleAhead: number,
  averageConsultationMinutes = 10,
) {
  const lower = Math.max(0, peopleAhead * Math.max(1, averageConsultationMinutes - 2));
  const upper = Math.max(lower, peopleAhead * (averageConsultationMinutes + 3));

  return { lower, upper };
}

export function formatWaitRange(lower: number, upper: number) {
  if (lower === 0 && upper === 0) {
    return "Your turn is near";
  }

  return `${lower}-${upper} minutes`;
}

export function sortQueueTokens(tokens: Token[]) {
  const priorityWeight: Record<TokenPriority, number> = {
    emergency: 0,
    urgent: 1,
    normal: 2,
  };

  return [...tokens].sort((a, b) => {
    const priorityDifference = priorityWeight[a.priority] - priorityWeight[b.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return a.token_number - b.token_number;
  });
}
