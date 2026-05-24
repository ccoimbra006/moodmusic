import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Vote, Check } from "lucide-react";
import { toast } from "sonner";

export default function MoodPoll() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const { data: poll } = trpc.polls.getActive.useQuery();
  const { data: myVote } = trpc.polls.myVote.useQuery(
    { pollId: poll?.id ?? 0 },
    { enabled: isAuthenticated && !!poll?.id }
  );
  const { data: results } = trpc.polls.results.useQuery(
    { pollId: poll?.id ?? 0 },
    { enabled: !!poll?.id }
  );

  const vote = trpc.polls.vote.useMutation({
    onSuccess: (data) => {
      if (data.voted) {
        toast.success("Voto registado!");
      } else {
        toast.error(data.error || "Erro ao votar");
      }
      utils.polls.myVote.invalidate();
      utils.polls.results.invalidate();
    },
    onError: () => toast.error("Erro ao votar"),
  });

  if (!poll) return null;

  const options: string[] = JSON.parse(poll.options || "[]");
  const hasEnded = new Date(poll.endsAt) < new Date();
  const alreadyVoted = !!myVote;

  if (hasEnded && !alreadyVoted) return null;

  return (
    <Card className="mb-6" style={{
      background: "rgba(255,255,255,0.06)",
      backdropFilter: "blur(24px)",
      border: "1px solid rgba(255,255,255,0.1)",
    }}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Vote className="w-5 h-5" style={{ color: "#00d4ff" }} />
          <h3 className="font-bold">{poll.question}</h3>
        </div>

        <div className="space-y-2">
          {options.map((option) => {
            const voteCount = results?.votes.find((v) => v.option === option)?.count ?? 0;
            const total = results?.total ?? 0;
            const pct = total > 0 ? Math.round((voteCount / total) * 100) : 0;
            const isSelected = myVote?.option === option;

            return (
              <div key={option}>
                <Button
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error("Faca login para votar");
                      return;
                    }
                    if (alreadyVoted) return;
                    vote.mutate({ pollId: poll.id, option });
                  }}
                  disabled={alreadyVoted || vote.isPending}
                  variant="outline"
                  className="w-full justify-between h-auto py-3 px-4 relative overflow-hidden"
                  style={{
                    borderColor: isSelected ? "#00d4ff" : "rgba(255,255,255,0.1)",
                    background: isSelected ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.03)",
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isSelected && <Check className="w-4 h-4" style={{ color: "#00d4ff" }} />}
                    {option}
                  </span>
                  {(alreadyVoted || hasEnded) && (
                    <span className="relative z-10 text-sm" style={{ color: "var(--text-muted)" }}>
                      {voteCount} voto{voteCount !== 1 ? "s" : ""} ({pct}%)
                    </span>
                  )}
                  {(alreadyVoted || hasEnded) && (
                    <div className="absolute left-0 top-0 h-full rounded-lg transition-all"
                      style={{
                        width: `${pct}%`,
                        background: isSelected ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.05)",
                      }}
                    />
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {alreadyVoted && (
          <p className="text-xs mt-3 text-center" style={{ color: "var(--text-muted)" }}>
            Ja votaste! Resultados atualizados em tempo real.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
