import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// Supabase client
const supabase = createClient(
  "https://gpgaxzsfmjlonvvrdvck.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZ2F4enNmbWpsb252dnJkdmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDE5MzIsImV4cCI6MjA4OTQxNzkzMn0.Qo_Juz2pV8FS7WL_3pQwJkgNzuJlmbcOKRQUQ7dKvjU"
);

// 2026 NCAA Tournament Bracket Data
const REGIONS = {
  east: {
    name: "East",
    seeds: [
      { seed: 1, team: "Duke" },
      { seed: 16, team: "Siena" },
      { seed: 8, team: "Ohio State" },
      { seed: 9, team: "TCU" },
      { seed: 5, team: "St. John's" },
      { seed: 12, team: "N. Iowa" },
      { seed: 4, team: "Kansas" },
      { seed: 13, team: "Cal Baptist" },
      { seed: 6, team: "Louisville" },
      { seed: 11, team: "S. Florida" },
      { seed: 3, team: "Michigan St" },
      { seed: 14, team: "N. Dakota St" },
      { seed: 7, team: "UCLA" },
      { seed: 10, team: "UCF" },
      { seed: 2, team: "UConn" },
      { seed: 15, team: "Furman" },
    ],
  },
  south: {
    name: "South",
    seeds: [
      { seed: 1, team: "Florida" },
      { seed: 16, team: "Lehigh" },
      { seed: 8, team: "Clemson" },
      { seed: 9, team: "Iowa" },
      { seed: 5, team: "Vanderbilt" },
      { seed: 12, team: "McNeese St" },
      { seed: 4, team: "Nebraska" },
      { seed: 13, team: "Troy" },
      { seed: 6, team: "UNC" },
      { seed: 11, team: "VCU" },
      { seed: 3, team: "Illinois" },
      { seed: 14, team: "Penn" },
      { seed: 7, team: "St. Mary's" },
      { seed: 10, team: "Texas A&M" },
      { seed: 2, team: "Houston" },
      { seed: 15, team: "Idaho" },
    ],
  },
  west: {
    name: "West",
    seeds: [
      { seed: 1, team: "Arizona" },
      { seed: 16, team: "Long Island" },
      { seed: 8, team: "Villanova" },
      { seed: 9, team: "Utah State" },
      { seed: 5, team: "Wisconsin" },
      { seed: 12, team: "High Point" },
      { seed: 4, team: "Arkansas" },
      { seed: 13, team: "Hawaii" },
      { seed: 6, team: "BYU" },
      { seed: 11, team: "Texas" },
      { seed: 3, team: "Gonzaga" },
      { seed: 14, team: "Kennesaw St" },
      { seed: 7, team: "Miami (FL)" },
      { seed: 10, team: "Missouri" },
      { seed: 2, team: "Purdue" },
      { seed: 15, team: "Queens (NC)" },
    ],
  },
  midwest: {
    name: "Midwest",
    seeds: [
      { seed: 1, team: "Michigan" },
      { seed: 16, team: "Howard" },
      { seed: 8, team: "Georgia" },
      { seed: 9, team: "St. Louis" },
      { seed: 5, team: "Texas Tech" },
      { seed: 12, team: "Akron" },
      { seed: 4, team: "Alabama" },
      { seed: 13, team: "Hofstra" },
      { seed: 6, team: "Tennessee" },
      { seed: 11, team: "Miami (OH)" },
      { seed: 3, team: "Virginia" },
      { seed: 14, team: "Wright St" },
      { seed: 7, team: "Kentucky" },
      { seed: 10, team: "Santa Clara" },
      { seed: 2, team: "Iowa State" },
      { seed: 15, team: "Tenn. State" },
    ],
  },
};

const ROUND_NAMES = ["R64", "R32", "S16", "E8", "F4", "Final"];
const ROUND_POINTS = [1, 2, 4, 6, 8, 10];

const ADMIN_PIN = "pool-boy";

// Storage keys no longer needed - using Supabase

function getMatchups(regionSeeds) {
  const pairs = [];
  for (let i = 0; i < regionSeeds.length; i += 2) {
    pairs.push([regionSeeds[i], regionSeeds[i + 1]]);
  }
  return pairs;
}

function buildEmptyBracket() {
  const bracket = {};
  const regionKeys = ["east", "south", "west", "midwest"];
  regionKeys.forEach((r) => {
    for (let round = 0; round < 4; round++) {
      const gamesInRound = 8 / Math.pow(2, round);
      for (let g = 0; g < gamesInRound; g++) {
        bracket[`${r}-${round}-${g}`] = null;
      }
    }
  });
  // Final Four: east vs south, west vs midwest
  bracket["ff-0"] = null;
  bracket["ff-1"] = null;
  // Championship
  bracket["champ"] = null;
  return bracket;
}

function getTeamForSlot(bracket, region, round, game, regionData) {
  if (round === 0) {
    const matchups = getMatchups(regionData.seeds);
    return matchups[game] || [null, null];
  }
  const prevGame1 = game * 2;
  const prevGame2 = game * 2 + 1;
  const team1Key = `${region}-${round - 1}-${prevGame1}`;
  const team2Key = `${region}-${round - 1}-${prevGame2}`;

  let t1 = bracket[team1Key];
  let t2 = bracket[team2Key];

  if (round === 1 && t1 === null) {
    const matchups = getMatchups(regionData.seeds);
    // not picked yet
  }

  return [t1, t2];
}

function TeamButton({ team, isSelected, onClick, disabled, small }) {
  if (!team) return (
    <div className={`team-slot empty ${small ? 'small' : ''}`}>
      <span className="seed-badge">—</span>
      <span className="team-name">TBD</span>
    </div>
  );

  return (
    <button
      className={`team-slot ${isSelected ? "selected" : ""} ${disabled ? "disabled" : ""} ${small ? 'small' : ''}`}
      onClick={disabled ? undefined : onClick}
      style={{ cursor: disabled ? "default" : "pointer" }}
    >
      <span className="seed-badge">{team.seed}</span>
      <span className="team-name">{team.team}</span>
    </button>
  );
}

function RegionBracket({ region, regionKey, bracket, setBracketPick, readOnly }) {
  const matchups = getMatchups(region.seeds);

  const getWinner = (round, game) => {
    const key = `${regionKey}-${round}-${game}`;
    return bracket[key];
  };

  const getMatchupTeams = (round, game) => {
    if (round === 0) return matchups[game];
    const t1 = getWinner(round - 1, game * 2);
    const t2 = getWinner(round - 1, game * 2 + 1);
    return [t1, t2];
  };

  const handlePick = (round, game, team) => {
    if (readOnly) return;
    const key = `${regionKey}-${round}-${game}`;
    setBracketPick(key, team);
  };

  const rounds = [0, 1, 2, 3];
  const roundLabels = ["R64", "R32", "Sweet 16", "Elite 8"];

  return (
    <div className="region-bracket">
      <h3 className="region-title">{region.name}</h3>
      <div className="region-rounds">
        {rounds.map((round) => {
          const gamesInRound = 8 / Math.pow(2, round);
          return (
            <div key={round} className="round-column">
              <div className="round-header">{roundLabels[round]}<span className="pts-badge">{ROUND_POINTS[round]}pt</span></div>
              <div className="round-games">
                {Array.from({ length: gamesInRound }).map((_, game) => {
                  const [t1, t2] = getMatchupTeams(round, game);
                  const winner = getWinner(round, game);
                  return (
                    <div key={game} className="matchup" style={{ marginTop: round > 0 ? `${Math.pow(2, round) * 4 - 8}px` : 0 }}>
                      <TeamButton
                        team={t1}
                        isSelected={winner && t1 && winner.team === t1.team}
                        onClick={() => t1 && handlePick(round, game, t1)}
                        disabled={readOnly || !t1}
                        small={round === 0}
                      />
                      <div className="vs-line"></div>
                      <TeamButton
                        team={t2}
                        isSelected={winner && t2 && winner.team === t2.team}
                        onClick={() => t2 && handlePick(round, game, t2)}
                        disabled={readOnly || !t2}
                        small={round === 0}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FinalFour({ bracket, setBracketPick, readOnly }) {
  const eastWinner = bracket["east-3-0"];
  const southWinner = bracket["south-3-0"];
  const westWinner = bracket["west-3-0"];
  const midwestWinner = bracket["midwest-3-0"];

  const ff1Winner = bracket["ff-0"];
  const ff2Winner = bracket["ff-1"];
  const champ = bracket["champ"];

  const handleFF = (game, team) => {
    if (readOnly || !team) return;
    setBracketPick(`ff-${game}`, team);
  };

  const handleChamp = (team) => {
    if (readOnly || !team) return;
    setBracketPick("champ", team);
  };

  return (
    <div className="final-four-section">
      <h3 className="region-title">Final Four & Championship</h3>
      <div className="ff-bracket">
        <div className="ff-semis">
          <div className="ff-game">
            <div className="ff-label">Semifinal 1 <span className="pts-badge">{ROUND_POINTS[4]}pt</span></div>
            <div className="matchup">
              <TeamButton team={eastWinner} isSelected={ff1Winner && eastWinner && ff1Winner.team === eastWinner.team} onClick={() => handleFF(0, eastWinner)} disabled={readOnly || !eastWinner} />
              <div className="vs-line"></div>
              <TeamButton team={southWinner} isSelected={ff1Winner && southWinner && ff1Winner.team === southWinner.team} onClick={() => handleFF(0, southWinner)} disabled={readOnly || !southWinner} />
            </div>
          </div>
          <div className="ff-game">
            <div className="ff-label">Semifinal 2 <span className="pts-badge">{ROUND_POINTS[4]}pt</span></div>
            <div className="matchup">
              <TeamButton team={westWinner} isSelected={ff2Winner && westWinner && ff2Winner.team === westWinner.team} onClick={() => handleFF(1, westWinner)} disabled={readOnly || !westWinner} />
              <div className="vs-line"></div>
              <TeamButton team={midwestWinner} isSelected={ff2Winner && midwestWinner && ff2Winner.team === midwestWinner.team} onClick={() => handleFF(1, midwestWinner)} disabled={readOnly || !midwestWinner} />
            </div>
          </div>
        </div>
        <div className="ff-champ">
          <div className="ff-label">Championship <span className="pts-badge gold">{ROUND_POINTS[5]}pt</span></div>
          <div className="matchup">
            <TeamButton team={ff1Winner} isSelected={champ && ff1Winner && champ.team === ff1Winner.team} onClick={() => handleChamp(ff1Winner)} disabled={readOnly || !ff1Winner} />
            <div className="vs-line"></div>
            <TeamButton team={ff2Winner} isSelected={champ && ff2Winner && champ.team === ff2Winner.team} onClick={() => handleChamp(ff2Winner)} disabled={readOnly || !ff2Winner} />
          </div>
          {champ && (
            <div className="champion-display">
              <div className="trophy">🏆</div>
              <div className="champ-name">{champ.seed} {champ.team}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function calculateScore(playerBracket, results) {
  if (!results || Object.keys(results).length === 0) return { total: 0, byRound: [0, 0, 0, 0, 0, 0], correct: 0, possible: 0 };

  let total = 0;
  const byRound = [0, 0, 0, 0, 0, 0];
  let correct = 0;
  let possible = 0;

  const regionKeys = ["east", "south", "west", "midwest"];
  regionKeys.forEach((r) => {
    for (let round = 0; round < 4; round++) {
      const gamesInRound = 8 / Math.pow(2, round);
      for (let g = 0; g < gamesInRound; g++) {
        const key = `${r}-${round}-${g}`;
        if (results[key]) {
          possible++;
          if (playerBracket[key] && results[key] && playerBracket[key].team === results[key].team) {
            correct++;
            total += ROUND_POINTS[round];
            byRound[round] += ROUND_POINTS[round];
          }
        }
      }
    }
  });

  ["ff-0", "ff-1"].forEach((key, i) => {
    if (results[key]) {
      possible++;
      if (playerBracket[key] && results[key] && playerBracket[key].team === results[key].team) {
        correct++;
        total += ROUND_POINTS[4];
        byRound[4] += ROUND_POINTS[4];
      }
    }
  });

  if (results["champ"]) {
    possible++;
    if (playerBracket["champ"] && results["champ"] && playerBracket["champ"].team === results["champ"].team) {
      correct++;
      total += ROUND_POINTS[5];
      byRound[5] += ROUND_POINTS[5];
    }
  }

  return { total, byRound, correct, possible };
}

function calculateMaxPossible(playerBracket, results) {
  const eliminatedTeams = new Set();
  const regionKeys = ["east", "south", "west", "midwest"];

  // Build set of eliminated teams from results
  regionKeys.forEach((r) => {
    for (let round = 0; round < 4; round++) {
      const gamesInRound = 8 / Math.pow(2, round);
      for (let g = 0; g < gamesInRound; g++) {
        const key = `${r}-${round}-${g}`;
        if (results[key]) {
          if (round === 0) {
            const regionData = REGIONS[r];
            const matchups = getMatchups(regionData.seeds);
            const [t1, t2] = matchups[g];
            if (results[key].team === t1.team) eliminatedTeams.add(t2.team);
            else eliminatedTeams.add(t1.team);
          } else {
            const prev1Key = `${r}-${round - 1}-${g * 2}`;
            const prev2Key = `${r}-${round - 1}-${g * 2 + 1}`;
            const t1 = results[prev1Key];
            const t2 = results[prev2Key];
            if (t1 && t2) {
              if (results[key].team === t1.team) eliminatedTeams.add(t2.team);
              else eliminatedTeams.add(t1.team);
            }
          }
        }
      }
    }
  });

  ["ff-0", "ff-1"].forEach((key) => {
    if (results[key]) {
      let t1, t2;
      if (key === "ff-0") { t1 = results["east-3-0"]; t2 = results["south-3-0"]; }
      else { t1 = results["west-3-0"]; t2 = results["midwest-3-0"]; }
      if (t1 && t2) {
        if (results[key].team === t1.team) eliminatedTeams.add(t2.team);
        else eliminatedTeams.add(t1.team);
      }
    }
  });

  if (results["champ"]) {
    const t1 = results["ff-0"];
    const t2 = results["ff-1"];
    if (t1 && t2) {
      if (results["champ"].team === t1.team) eliminatedTeams.add(t2.team);
      else eliminatedTeams.add(t1.team);
    }
  }

  // Current points + future points from alive picks
  let currentScore = 0;
  let futurePossible = 0;

  regionKeys.forEach((r) => {
    for (let round = 0; round < 4; round++) {
      const gamesInRound = 8 / Math.pow(2, round);
      for (let g = 0; g < gamesInRound; g++) {
        const key = `${r}-${round}-${g}`;
        if (results[key]) {
          if (playerBracket[key] && playerBracket[key].team === results[key].team) {
            currentScore += ROUND_POINTS[round];
          }
        } else {
          if (playerBracket[key] && !eliminatedTeams.has(playerBracket[key].team)) {
            futurePossible += ROUND_POINTS[round];
          }
        }
      }
    }
  });

  ["ff-0", "ff-1"].forEach((key) => {
    if (results[key]) {
      if (playerBracket[key] && playerBracket[key].team === results[key].team) {
        currentScore += ROUND_POINTS[4];
      }
    } else {
      if (playerBracket[key] && !eliminatedTeams.has(playerBracket[key].team)) {
        futurePossible += ROUND_POINTS[4];
      }
    }
  });

  if (results["champ"]) {
    if (playerBracket["champ"] && playerBracket["champ"].team === results["champ"].team) {
      currentScore += ROUND_POINTS[5];
    }
  } else {
    if (playerBracket["champ"] && !eliminatedTeams.has(playerBracket["champ"].team)) {
      futurePossible += ROUND_POINTS[5];
    }
  }

  return currentScore + futurePossible;
}

function Leaderboard({ players, results }) {
  const hasResults = results && Object.keys(results).length > 0;
  const scored = players.map((p) => {
    const score = calculateScore(p.bracket, results);
    const maxPossible = calculateMaxPossible(p.bracket, results);
    return { ...p, score, maxPossible };
  }).sort((a, b) => b.score.total - a.score.total);

  const maxTotal = 32 * 1 + 16 * 2 + 8 * 4 + 4 * 6 + 2 * 8 + 1 * 10 ;

  return (
    <div className="leaderboard">
      <div className="lb-header-row">
        <span className="lb-rank">#</span>
        <span className="lb-name">Player</span>
        <span className="lb-champ">Champion</span>
        <span className="lb-round">R64</span>
        <span className="lb-round">R32</span>
        <span className="lb-round">S16</span>
        <span className="lb-round">E8</span>
        <span className="lb-round">F4</span>
        <span className="lb-round">FIN</span>
        <span className="lb-total">Total</span>
        <span className="lb-max">Max</span>
      </div>
      {scored.map((p, i) => (
        <div key={p.name} className={`lb-row ${i === 0 && p.score.total > 0 ? "leader" : ""} ${i % 2 === 0 ? 'even' : ''}`}>
          <span className="lb-rank">{i + 1}</span>
          <span className="lb-name">{p.name}</span>
          <span className="lb-champ">{p.bracket.champ ? `(${p.bracket.champ.seed}) ${p.bracket.champ.team}` : "—"}</span>
          {p.score.byRound.map((r, ri) => (
            <span key={ri} className="lb-round">{r}</span>
          ))}
          <span className="lb-total">{p.score.total}</span>
          <span className="lb-max">{hasResults ? p.maxPossible : maxTotal}</span>
        </div>
      ))}
      <div className="lb-footer">
        <span>Scoring: 1-2-4-6-8-10 per round</span>
        <span>Max possible: {maxTotal} pts</span>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home"); // home, entry, leaderboard, results, viewBracket
  const [players, setPlayers] = useState([]);
  const [results, setResults] = useState({});
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [editingBracket, setEditingBracket] = useState(null);
  const [viewingPlayer, setViewingPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState(null);
  const [notification, setNotification] = useState(null);
  const [rawDataTab, setRawDataTab] = useState("summary");
  const [exportText, setExportText] = useState("");
  const [exportLabel, setExportLabel] = useState("");
  const [importText, setImportText] = useState("");

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const requireAdmin = (action) => {
    if (isAdmin) {
      action();
    } else {
      setPendingAdminAction(() => action);
      setPinInput("");
      setShowPinModal(true);
    }
  };

  const handlePinSubmit = () => {
    if (pinInput === ADMIN_PIN) {
      setIsAdmin(true);
      setShowPinModal(false);
      if (pendingAdminAction) {
        pendingAdminAction();
        setPendingAdminAction(null);
      }
      showNotification("Admin access granted!");
    } else {
      showNotification("Wrong PIN!", "error");
      setPinInput("");
    }
  };

  // Load data from Supabase and subscribe to real-time updates
  useEffect(() => {
    async function loadData() {
      try {
        // Load players
        const { data: playersData } = await supabase
          .from("players")
          .select("*")
          .order("created_at");
        if (playersData) {
          setPlayers(playersData.map(p => ({ name: p.name, bracket: p.bracket || {} })));
        }

        // Load results
        const { data: resultsData } = await supabase
          .from("results")
          .select("*")
          .eq("id", "current")
          .single();
        if (resultsData) {
          setResults(resultsData.data || {});
        }
      } catch (e) {
        console.error("Load error:", e);
      }
      setIsLoading(false);
    }
    loadData();

    // Real-time subscriptions
    const playersChannel = supabase
      .channel("players-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => {
        // Reload all players on any change
        supabase.from("players").select("*").order("created_at").then(({ data }) => {
          if (data) setPlayers(data.map(p => ({ name: p.name, bracket: p.bracket || {} })));
        });
      })
      .subscribe();

    const resultsChannel = supabase
      .channel("results-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, () => {
        supabase.from("results").select("*").eq("id", "current").single().then(({ data }) => {
          if (data) setResults(data.data || {});
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
      supabase.removeChannel(resultsChannel);
    };
  }, []);

  const savePlayers = async (newPlayers) => {
    setPlayers(newPlayers);
    // We don't bulk-replace here — individual saves happen in saveBracket/deletePlayer
  };

  const saveResults = async (newResults) => {
    setResults(newResults);
    try {
      await supabase
        .from("results")
        .upsert({ id: "current", data: newResults, updated_at: new Date().toISOString() });
    } catch (e) {
      console.error("Save results error:", e);
    }
  };

  const handleNewPlayer = () => {
    const name = currentPlayer.trim();
    if (!name) return;
    if (players.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
      showNotification("Player already exists!", "error");
      return;
    }
    if (players.length >= 12) {
      showNotification("Max 12 players!", "error");
      return;
    }
    const newBracket = buildEmptyBracket();
    setEditingBracket(newBracket);
    setView("entry");
  };

  const handleEditPlayer = (player) => {
    setCurrentPlayer(player.name);
    setEditingBracket({ ...player.bracket });
    setView("entry");
  };

  const setBracketPick = useCallback((key, team) => {
    setEditingBracket((prev) => {
      const next = { ...prev, [key]: team };

      // Clear downstream picks if they depended on the changed slot
      const regionKeys = ["east", "south", "west", "midwest"];
      const parts = key.split("-");

      if (parts[0] !== "ff" && parts[0] !== "champ") {
        const region = parts[0];
        const round = parseInt(parts[1]);
        const game = parseInt(parts[2]);

        // Clear next rounds in region
        for (let r = round + 1; r < 4; r++) {
          const nextGame = Math.floor(game / Math.pow(2, r - round));
          const nextKey = `${region}-${r}-${nextGame}`;
          if (next[nextKey] && prev[key] && next[nextKey].team === prev[key].team) {
            next[nextKey] = null;
          }
        }

        // Clear FF if region winner changed
        if (round <= 3) {
          const regionWinnerKey = `${region}-3-0`;
          const oldRegionWinner = prev[regionWinnerKey];
          // check all FF and champ
          if (oldRegionWinner) {
            const ffGame = region === "east" || region === "south" ? "ff-0" : "ff-1";
            if (next[ffGame] && next[ffGame].team === oldRegionWinner.team) {
              next[ffGame] = null;
            }
            if (next["champ"] && next["champ"].team === oldRegionWinner.team) {
              next["champ"] = null;
            }
          }
        }
      }

      if (key === "ff-0" || key === "ff-1") {
        if (prev[key] && next["champ"] && next["champ"].team === prev[key].team) {
          next["champ"] = null;
        }
      }

      return next;
    });
  }, []);

  const saveBracket = async () => {
    const name = currentPlayer.trim();
    if (!name) return;

    // Count picks
    let pickCount = 0;
    Object.values(editingBracket).forEach(v => { if (v) pickCount++; });
    if (pickCount < 63) {
      showNotification(`Only ${pickCount}/63 games picked. Complete your bracket!`, "error");
      return;
    }

    try {
      await supabase
        .from("players")
        .upsert(
          { name, bracket: editingBracket, updated_at: new Date().toISOString() },
          { onConflict: "name" }
        );

      // Update local state
      const existing = players.findIndex((p) => p.name.toLowerCase() === name.toLowerCase());
      let newPlayers;
      if (existing >= 0) {
        newPlayers = [...players];
        newPlayers[existing] = { name, bracket: editingBracket };
      } else {
        newPlayers = [...players, { name, bracket: editingBracket }];
      }
      setPlayers(newPlayers);
      setCurrentPlayer("");
      setEditingBracket(null);
      setView("home");
      showNotification(`${name}'s bracket saved!`);
    } catch (e) {
      console.error("Save bracket error:", e);
      showNotification("Error saving bracket!", "error");
    }
  };

  const deletePlayer = async (name) => {
    try {
      await supabase.from("players").delete().eq("name", name);
      setPlayers(players.filter((p) => p.name !== name));
      showNotification(`${name} removed.`);
    } catch (e) {
      console.error("Delete error:", e);
      showNotification("Error deleting player!", "error");
    }
  };

  const handleResultPick = useCallback((key, team) => {
    setResults((prev) => {
      const next = { ...prev, [key]: team };
      return next;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-trophy">🏀</div>
        <p>Loading bracket pool...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        .app {
          font-family: 'Source Sans 3', sans-serif;
          background: #0a0e1a;
          min-height: 100vh;
          color: #e8e6e1;
        }

        .app-loading {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 100vh; background: #0a0e1a; color: #e8e6e1;
          font-family: 'Oswald', sans-serif; font-size: 1.2rem;
        }
        .loading-trophy { font-size: 3rem; animation: bounce 1s ease infinite; }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

        .notification {
          position: fixed; top: 20px; right: 20px; z-index: 1000;
          padding: 14px 24px; border-radius: 8px; font-weight: 600;
          animation: slideIn 0.3s ease;
          font-family: 'Source Sans 3', sans-serif;
        }
        .notification.success { background: #10b981; color: #fff; }
        .notification.error { background: #ef4444; color: #fff; }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: linear-gradient(135deg, #1a1f35 0%, #0d1117 100%);
          border-bottom: 3px solid #f59e0b;
          padding: 20px 30px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
        }
        .header-title {
          font-family: 'Oswald', sans-serif; font-size: 1.8rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 2px;
          background: linear-gradient(135deg, #f59e0b, #f97316);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .header-subtitle {
          font-size: 0.85rem; color: #9ca3af; font-weight: 400;
          letter-spacing: 1px;
        }
        .header-scoring {
          display: flex; gap: 6px; align-items: center; flex-wrap: wrap;
        }
        .scoring-chip {
          background: #1e293b; border: 1px solid #334155; border-radius: 6px;
          padding: 4px 8px; font-size: 0.7rem; color: #94a3b8;
          font-family: 'Oswald', sans-serif; letter-spacing: 0.5px;
        }
        .scoring-chip span { color: #f59e0b; font-weight: 600; }

        nav {
          position: sticky;
          top: 0;
          z-index: 99;
          display: flex; gap: 4px; padding: 12px 30px;
          display: flex; gap: 4px; padding: 12px 30px;
          background: #111827; border-bottom: 1px solid #1e293b;
        }
        nav button {
          font-family: 'Oswald', sans-serif; font-size: 0.9rem;
          padding: 8px 20px; border: none; border-radius: 6px;
          cursor: pointer; text-transform: uppercase; letter-spacing: 1px;
          transition: all 0.2s; background: transparent; color: #9ca3af;
        }
        nav button:hover { background: #1e293b; color: #e8e6e1; }
        nav button.active { background: #f59e0b; color: #0a0e1a; font-weight: 600; }

        .admin-toggle {
          margin-left: auto; font-family: 'Oswald', sans-serif; font-size: 0.8rem;
          padding: 6px 14px; border: 1px solid #334155; border-radius: 6px;
          cursor: pointer; text-transform: uppercase; letter-spacing: 1px;
          transition: all 0.2s; background: #1e293b; color: #6b7280;
        }
        .admin-toggle:hover { border-color: #f59e0b; color: #f59e0b; }
        .admin-toggle.admin-active { border-color: #10b981; color: #10b981; background: #0a2a1a; }

        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7); z-index: 999;
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal {
          background: #111827; border: 1px solid #334155; border-radius: 12px;
          padding: 24px; min-width: 320px; max-width: 400px;
        }
        .modal-title {
          font-family: 'Oswald', sans-serif; font-size: 1.3rem;
          color: #f59e0b; text-transform: uppercase; margin-bottom: 8px;
        }

        .content { padding: 24px 30px; max-width: 1400px; margin: 0 auto; }

        /* Home */
        .home-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 20px; }
        @media (max-width: 800px) { .home-grid { grid-template-columns: 1fr; } }

        .card {
          background: #111827; border: 1px solid #1e293b; border-radius: 12px;
          padding: 24px; transition: border-color 0.2s;
        }
        .card:hover { border-color: #334155; }
        .card h2 {
          font-family: 'Oswald', sans-serif; font-size: 1.3rem;
          text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;
          color: #f59e0b;
        }

        .player-input-row { display: flex; gap: 8px; margin-bottom: 16px; }
        .player-input-row input {
          flex: 1; padding: 10px 14px; border-radius: 8px;
          border: 1px solid #334155; background: #1e293b; color: #e8e6e1;
          font-size: 1rem; font-family: 'Source Sans 3', sans-serif;
          outline: none; transition: border-color 0.2s;
        }
        .player-input-row input:focus { border-color: #f59e0b; }
        .player-input-row input::placeholder { color: #6b7280; }

        .btn {
          padding: 10px 20px; border: none; border-radius: 8px;
          font-family: 'Oswald', sans-serif; font-size: 0.9rem;
          cursor: pointer; text-transform: uppercase; letter-spacing: 1px;
          transition: all 0.2s; font-weight: 600;
        }
        .btn-primary { background: #f59e0b; color: #0a0e1a; }
        .btn-primary:hover { background: #d97706; }
        .btn-secondary { background: #1e293b; color: #e8e6e1; border: 1px solid #334155; }
        .btn-secondary:hover { background: #334155; }
        .btn-danger { background: #7f1d1d; color: #fca5a5; }
        .btn-danger:hover { background: #991b1b; }
        .btn-sm { padding: 6px 12px; font-size: 0.75rem; }

        .player-list { display: flex; flex-direction: column; gap: 8px; }
        .player-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px; background: #1e293b; border-radius: 8px;
          border: 1px solid #334155;
        }
        .player-row-name { font-weight: 600; font-size: 1rem; }
        .player-row-champ { font-size: 0.8rem; color: #9ca3af; }
        .player-row-actions { display: flex; gap: 6px; }

        /* Bracket Entry */
        .bracket-entry-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
        }
        .bracket-entry-header h2 {
          font-family: 'Oswald', sans-serif; font-size: 1.5rem; color: #f59e0b;
          text-transform: uppercase;
        }
        .pick-counter {
          font-family: 'Oswald', sans-serif; font-size: 1rem;
          color: #9ca3af; background: #1e293b; padding: 6px 14px;
          border-radius: 8px; border: 1px solid #334155;
        }
        .pick-counter span { color: #10b981; font-weight: 600; }

        .regions-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
        }
        @media (max-width: 1000px) { .regions-grid { grid-template-columns: 1fr; } }

        .region-bracket {
          background: #111827; border: 1px solid #1e293b; border-radius: 12px;
          padding: 16px; overflow-x: auto;
        }
        .region-title {
          font-family: 'Oswald', sans-serif; font-size: 1.2rem;
          text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px;
          color: #f59e0b; text-align: center;
        }
        .region-rounds { display: flex; gap: 8px; min-width: 500px; }
        .round-column { flex: 1; display: flex; flex-direction: column; }
        .round-header {
          font-family: 'Oswald', sans-serif; font-size: 0.75rem;
          text-transform: uppercase; letter-spacing: 1px; color: #6b7280;
          text-align: center; margin-bottom: 8px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .pts-badge {
          background: #1e293b; color: #f59e0b; padding: 2px 6px;
          border-radius: 4px; font-size: 0.65rem; font-weight: 600;
        }
        .pts-badge.gold { background: #f59e0b; color: #0a0e1a; }
        .round-games { display: flex; flex-direction: column; gap: 4px; justify-content: space-around; flex: 1; }

        .matchup {
          display: flex; flex-direction: column; gap: 1px;
          background: #0a0e1a; border-radius: 6px; padding: 2px;
        }

        .team-slot {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 8px; border-radius: 4px;
          background: #1e293b; border: 1px solid #334155;
          color: #e8e6e1; font-size: 0.8rem; font-family: 'Source Sans 3', sans-serif;
          transition: all 0.15s; width: 100%; text-align: left;
        }
        .team-slot.small { padding: 4px 6px; font-size: 0.72rem; }
        .team-slot:not(.disabled):not(.empty):hover { border-color: #f59e0b; background: #1a2332; }
        .team-slot.selected {
          background: #1a3a2a; border-color: #10b981; color: #6ee7b7;
          font-weight: 600;
        }
        .team-slot.empty { opacity: 0.4; }
        .team-slot.disabled { opacity: 0.7; }

        .seed-badge {
          background: #0a0e1a; color: #f59e0b; padding: 1px 5px;
          border-radius: 3px; font-size: 0.65rem; font-weight: 700;
          font-family: 'Oswald', sans-serif; min-width: 20px; text-align: center;
        }
        .team-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .vs-line { height: 1px; background: #334155; margin: 0 8px; }

        /* Final Four */
        .final-four-section {
          background: #111827; border: 1px solid #1e293b; border-radius: 12px;
          padding: 20px; margin-top: 20px;
        }
        .ff-bracket { display: flex; align-items: center; justify-content: center; gap: 30px; flex-wrap: wrap; }
        .ff-semis { display: flex; flex-direction: column; gap: 20px; }
        .ff-game { min-width: 220px; }
        .ff-label {
          font-family: 'Oswald', sans-serif; font-size: 0.85rem;
          text-transform: uppercase; color: #6b7280; margin-bottom: 6px;
          display: flex; align-items: center; gap: 8px;
        }
        .ff-champ { min-width: 220px; }
        .champion-display {
          margin-top: 12px; text-align: center; padding: 16px;
          background: linear-gradient(135deg, #422006, #1a1f35);
          border: 2px solid #f59e0b; border-radius: 10px;
        }
        .trophy { font-size: 2.5rem; }
        .champ-name {
          font-family: 'Oswald', sans-serif; font-size: 1.3rem;
          color: #f59e0b; font-weight: 700; text-transform: uppercase;
          margin-top: 4px;
        }

        /* Leaderboard */
        .leaderboard {
          background: #111827; border: 1px solid #1e293b; border-radius: 12px;
          overflow: hidden;
        }
        .lb-header-row, .lb-row {
          display: grid;
          grid-template-columns: 40px 120px 140px repeat(6, 48px) 60px 60px;
          align-items: center; padding: 10px 16px; gap: 4px;
          font-size: 0.82rem;
        }
        @media (max-width: 800px) {
          .lb-header-row, .lb-row {
            grid-template-columns: 30px 80px 100px repeat(6, 36px) 50px 50px;
            font-size: 0.7rem; padding: 8px 10px;
          }
        }
        .lb-header-row {
          background: #1e293b; font-family: 'Oswald', sans-serif;
          text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.5px;
          color: #9ca3af; font-weight: 600;
        }
        .lb-row { border-bottom: 1px solid #1e293b; }
        .lb-row.even { background: #0f1520; }
        .lb-row.leader { background: linear-gradient(90deg, #422006 0%, #111827 100%); border-left: 3px solid #f59e0b; }
        .lb-rank { font-family: 'Oswald', sans-serif; font-weight: 700; color: #6b7280; }
        .lb-row.leader .lb-rank { color: #f59e0b; }
        .lb-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lb-champ { color: #9ca3af; font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lb-round { text-align: center; color: #9ca3af; }
        .lb-total { text-align: center; font-weight: 700; font-family: 'Oswald', sans-serif; font-size: 1.1rem; color: #10b981; }
        .lb-row.leader .lb-total { color: #f59e0b; }
        .lb-max { text-align: center; font-weight: 600; font-family: 'Oswald', sans-serif; font-size: 0.9rem; color: #6b7280; }
        .lb-row.leader .lb-max { color: #a3845c; }
        .lb-footer {
          display: flex; justify-content: space-between; padding: 10px 16px;
          font-size: 0.75rem; color: #6b7280; background: #0f1520;
        }

        /* Results Admin */
        .admin-login { display: flex; gap: 8px; margin-bottom: 20px; }
        .admin-login input {
          padding: 8px 12px; border-radius: 8px; border: 1px solid #334155;
          background: #1e293b; color: #e8e6e1; font-size: 0.9rem;
          font-family: 'Source Sans 3', sans-serif; outline: none;
        }

        .no-data {
          text-align: center; padding: 40px; color: #6b7280;
          font-family: 'Oswald', sans-serif; font-size: 1.1rem;
        }
        .no-data span { font-size: 2rem; display: block; margin-bottom: 10px; }

        /* Data Management */
        .file-input {
          font-family: 'Source Sans 3', sans-serif; font-size: 0.9rem;
          color: #e8e6e1;
        }
        .file-input::file-selector-button {
          padding: 8px 16px; border-radius: 8px; border: 1px solid #334155;
          background: #1e293b; color: #e8e6e1; cursor: pointer;
          font-family: 'Oswald', sans-serif; text-transform: uppercase;
          letter-spacing: 0.5px; font-size: 0.8rem; margin-right: 12px;
          transition: all 0.2s;
        }
        .file-input::file-selector-button:hover { background: #334155; }

        .raw-data-box {
          background: #0a0e1a; border: 1px solid #1e293b; border-radius: 8px;
          padding: 16px; max-height: 500px; overflow: auto;
          font-family: 'Courier New', monospace; font-size: 0.78rem;
          color: #9ca3af; white-space: pre-wrap; word-break: break-all;
          line-height: 1.5;
        }
        .summary-grid { display: flex; flex-direction: column; gap: 16px; }
        .summary-item { }
        .summary-label {
          font-family: 'Oswald', sans-serif; font-size: 0.85rem;
          text-transform: uppercase; letter-spacing: 1px; color: #6b7280;
          margin-bottom: 4px;
        }
        .summary-value {
          font-family: 'Oswald', sans-serif; font-size: 1.5rem;
          color: #10b981; font-weight: 700;
        }
        .summary-value-list { display: flex; flex-direction: column; gap: 4px; font-size: 0.9rem; }
        .summary-champ-row { display: flex; gap: 6px; }

        .export-textarea {
          width: 100%; min-height: 120px; max-height: 300px;
          background: #0a0e1a; border: 1px solid #334155; border-radius: 8px;
          padding: 12px; color: #9ca3af; font-family: 'Courier New', monospace;
          font-size: 0.75rem; resize: vertical; outline: none;
          line-height: 1.4;
        }
        .export-textarea:focus { border-color: #f59e0b; }
        .export-textarea::placeholder { color: #4b5563; }
      `}</style>
      
      {notification && (
        <div className={`notification ${notification.type}`}>{notification.msg}</div>
      )}

      {showPinModal && (
        <div className="modal-overlay" onClick={() => setShowPinModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">🔒 Admin Access</h3>
            <p style={{ color: "#9ca3af", marginBottom: 12, fontSize: "0.9rem" }}>Enter the admin PIN to continue.</p>
            <div className="player-input-row">
              <input
                type="password"
                placeholder="Enter PIN..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                autoFocus
              />
              <button className="btn btn-primary" onClick={handlePinSubmit}>Unlock</button>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => setShowPinModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      <header>
        <div>
          <div className="header-title">🏀 Price Family March Madness Pool 2026</div>
          <div className="header-subtitle">Bracket Challenge</div>
        </div>
        <div className="header-scoring">
          {ROUND_NAMES.map((r, i) => (
            <div key={r} className="scoring-chip">{r}: <span>{ROUND_POINTS[i]}</span></div>
          ))}
        </div>
      </header>

      <nav>
        <button className={view === "home" ? "active" : ""} onClick={() => { setView("home"); setEditingBracket(null); }}>Home</button>
        <button className={view === "leaderboard" ? "active" : ""} onClick={() => setView("leaderboard")}>Leaderboard</button>
        {isAdmin && (
          <>
            <button className={view === "results" ? "active" : ""} onClick={() => setView("results")}>Results</button>
            <button className={view === "data" ? "active" : ""} onClick={() => setView("data")}>Data</button>
          </>
        )}
        <button
          className={`admin-toggle ${isAdmin ? "admin-active" : ""}`}
          onClick={() => {
            if (isAdmin) {
              setIsAdmin(false);
              setView("home");
              showNotification("Admin logged out.");
            } else {
              setPinInput("");
              setPendingAdminAction(null);
              setShowPinModal(true);
            }
          }}
        >
          {isAdmin ? "🔓 Admin" : "🔒 Admin"}
        </button>
      </nav>

      <div className="content">
        {/* HOME */}
        {view === "home" && (
          <>
            <div className="home-grid">
              <div className="card">
                <h2>Add Player</h2>
                <div className="player-input-row">
                  <input
                    placeholder="Enter player name..."
                    value={currentPlayer}
                    onChange={(e) => setCurrentPlayer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNewPlayer()}
                  />
                  <button className="btn btn-primary" onClick={handleNewPlayer}>Fill Bracket</button>
                </div>
              </div>
              <div className="card">
                <h2>Pool Info</h2>
                <p style={{ color: "#9ca3af", lineHeight: 1.6 }}>
                  {players.length} player{players.length !== 1 ? "s" : ""} entered.
                  Scoring: <strong style={{ color: "#f59e0b" }}>1-2-4-6-8-10</strong> per round.
                  Max possible: <strong style={{ color: "#10b981" }}>146 pts</strong>.
                </p>
              </div>
            </div>
            <div className="card" style={{ marginTop: 20 }}>
              <h2>Players ({players.length})</h2>
              {players.length === 0 ? (
                <div className="no-data"><span>📋</span>No players yet. Add a name above to start.</div>
              ) : (
                <div className="player-list">
                  {players.map((p) => (
                    <div key={p.name} className="player-row">
                      <div>
                        <div className="player-row-name">{p.name}</div>
                        <div className="player-row-champ">
                          Champion: {p.bracket.champ ? `(${p.bracket.champ.seed}) ${p.bracket.champ.team}` : "—"}
                        </div>
                      </div>
                      <div className="player-row-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => { setViewingPlayer(p); setView("viewBracket"); }}>View</button>
                        {isAdmin && (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEditPlayer(p)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => deletePlayer(p.name)}>Delete</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* BRACKET ENTRY */}
        {view === "entry" && editingBracket && (
          <>
            <div className="bracket-entry-header">
              <h2>{currentPlayer}'s Bracket</h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div className="pick-counter">
                  Picks: <span>{Object.values(editingBracket).filter(Boolean).length}</span>/63
                </div>
                <button className="btn btn-primary" onClick={saveBracket}>Save Bracket</button>
                <button className="btn btn-secondary" onClick={() => { setView("home"); setEditingBracket(null); }}>Cancel</button>
              </div>
            </div>
            <div className="regions-grid">
              {["east", "south", "west", "midwest"].map((rk) => (
                <RegionBracket
                  key={rk}
                  region={REGIONS[rk]}
                  regionKey={rk}
                  bracket={editingBracket}
                  setBracketPick={setBracketPick}
                />
              ))}
            </div>
            <FinalFour bracket={editingBracket} setBracketPick={setBracketPick} />
          </>
        )}

        {/* VIEW BRACKET */}
        {view === "viewBracket" && viewingPlayer && (
          <>
            <div className="bracket-entry-header">
              <h2>{viewingPlayer.name}'s Bracket</h2>
              <button className="btn btn-secondary" onClick={() => { setView("home"); setViewingPlayer(null); }}>Back</button>
            </div>
            <div className="regions-grid">
              {["east", "south", "west", "midwest"].map((rk) => (
                <RegionBracket
                  key={rk}
                  region={REGIONS[rk]}
                  regionKey={rk}
                  bracket={viewingPlayer.bracket}
                  setBracketPick={() => {}}
                  readOnly
                />
              ))}
            </div>
            <FinalFour bracket={viewingPlayer.bracket} setBracketPick={() => {}} readOnly />
          </>
        )}

        {/* LEADERBOARD */}
        {view === "leaderboard" && (
          <>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1.5rem", color: "#f59e0b", textTransform: "uppercase", marginBottom: 16 }}>
              Leaderboard
            </h2>
            {players.length === 0 ? (
              <div className="card"><div className="no-data"><span>🏆</span>Add players and fill out brackets to see the leaderboard.</div></div>
            ) : (
              <Leaderboard players={players} results={results} />
            )}
          </>
        )}

        {/* RESULTS ENTRY */}
        {view === "results" && (
          <>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1.5rem", color: "#f59e0b", textTransform: "uppercase", marginBottom: 16 }}>
              Enter Results (Admin)
            </h2>
            <p style={{ color: "#9ca3af", marginBottom: 16, fontSize: "0.9rem" }}>
              Click on winning teams as games are played. The leaderboard will update automatically.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button className="btn btn-primary" onClick={() => saveResults(results)}>Save Results</button>
            </div>
            <div className="regions-grid">
              {["east", "south", "west", "midwest"].map((rk) => (
                <RegionBracket
                  key={rk}
                  region={REGIONS[rk]}
                  regionKey={rk}
                  bracket={results}
                  setBracketPick={handleResultPick}
                />
              ))}
            </div>
            <FinalFour bracket={results} setBracketPick={handleResultPick} />
          </>
        )}

        {/* DATA MANAGEMENT */}
        {view === "data" && (
          <>
            <h2 style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1.5rem", color: "#f59e0b", textTransform: "uppercase", marginBottom: 16 }}>
              Data Management
            </h2>

            <div className="home-grid">
              <div className="card">
                <h2>Export Data</h2>
                <p style={{ color: "#9ca3af", marginBottom: 12, fontSize: "0.9rem", lineHeight: 1.5 }}>
                  Copy data to clipboard, then paste into a text file or notes app to back up.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <button className="btn btn-primary" onClick={() => {
                    const data = { players, results, exportedAt: new Date().toISOString(), type: "full" };
                    setExportText(JSON.stringify(data, null, 2));
                    setExportLabel("Full Backup");
                    try { navigator.clipboard.writeText(JSON.stringify(data, null, 2)); showNotification("Full backup copied to clipboard!"); } catch(e) { showNotification("Text shown below — select all and copy manually", "error"); }
                  }}>Copy All Data</button>
                  <button className="btn btn-secondary" onClick={() => {
                    const data = { players, exportedAt: new Date().toISOString(), type: "players" };
                    setExportText(JSON.stringify(data, null, 2));
                    setExportLabel("Players Only");
                    try { navigator.clipboard.writeText(JSON.stringify(data, null, 2)); showNotification("Players copied to clipboard!"); } catch(e) { showNotification("Text shown below — select all and copy manually", "error"); }
                  }}>Copy Players Only</button>
                  <button className="btn btn-secondary" onClick={() => {
                    const data = { results, exportedAt: new Date().toISOString(), type: "results" };
                    setExportText(JSON.stringify(data, null, 2));
                    setExportLabel("Results Only");
                    try { navigator.clipboard.writeText(JSON.stringify(data, null, 2)); showNotification("Results copied to clipboard!"); } catch(e) { showNotification("Text shown below — select all and copy manually", "error"); }
                  }}>Copy Results Only</button>
                </div>
                {exportText && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{exportLabel} — select all and copy if clipboard didn't work</span>
                      <button className="btn btn-secondary btn-sm" onClick={() => setExportText("")}>Close</button>
                    </div>
                    <textarea
                      className="export-textarea"
                      value={exportText}
                      readOnly
                      onClick={(e) => e.target.select()}
                    />
                  </div>
                )}
              </div>

              <div className="card">
                <h2>Import Data</h2>
                <p style={{ color: "#9ca3af", marginBottom: 12, fontSize: "0.9rem", lineHeight: 1.5 }}>
                  Paste previously exported JSON data below, or upload a .json file.
                </p>
                <textarea
                  className="export-textarea"
                  placeholder="Paste exported JSON data here..."
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn btn-primary" onClick={async () => {
                    if (!importText.trim()) { showNotification("Paste data first!", "error"); return; }
                    try {
                      const data = JSON.parse(importText);
                      let imported = [];
                      if (data.players && Array.isArray(data.players)) {
                        for (const p of data.players) {
                          await supabase.from("players").upsert(
                            { name: p.name, bracket: p.bracket, updated_at: new Date().toISOString() },
                            { onConflict: "name" }
                          );
                        }
                        setPlayers(data.players);
                        imported.push(`${data.players.length} players`);
                      }
                      if (data.results && typeof data.results === "object" && !Array.isArray(data.results)) {
                        await saveResults(data.results);
                        const count = Object.values(data.results).filter(Boolean).length;
                        imported.push(`${count} results`);
                      }
                      if (imported.length > 0) {
                        showNotification(`Imported: ${imported.join(", ")}`);
                        setImportText("");
                      } else {
                        showNotification("No valid data found!", "error");
                      }
                    } catch (err) {
                      showNotification("Invalid JSON format!", "error");
                    }
                  }}>Import from Paste</button>
                  <span style={{ color: "#6b7280", fontSize: "0.85rem", alignSelf: "center" }}>or</span>
                  <label className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center" }}>
                    Upload .json File
                    <input
                      type="file"
                      accept=".json"
                      style={{ display: "none" }}
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        try {
                          const text = await file.text();
                          const data = JSON.parse(text);
                          let imported = [];
                          if (data.players && Array.isArray(data.players)) {
                            for (const p of data.players) {
                              await supabase.from("players").upsert(
                                { name: p.name, bracket: p.bracket, updated_at: new Date().toISOString() },
                                { onConflict: "name" }
                              );
                            }
                            setPlayers(data.players);
                            imported.push(`${data.players.length} players`);
                          }
                          if (data.results && typeof data.results === "object" && !Array.isArray(data.results)) {
                            await saveResults(data.results);
                            const count = Object.values(data.results).filter(Boolean).length;
                            imported.push(`${count} results`);
                          }
                          if (imported.length > 0) {
                            showNotification(`Imported: ${imported.join(", ")}`);
                          } else {
                            showNotification("No valid data found in file!", "error");
                          }
                        } catch (err) {
                          showNotification("Invalid file format!", "error");
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <h2>Raw Data Viewer</h2>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button className={`btn ${rawDataTab === "summary" ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => setRawDataTab("summary")}>
                  Summary
                </button>
                <button className={`btn ${rawDataTab === "players" ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => setRawDataTab("players")}>
                  Players ({players.length})
                </button>
                <button className={`btn ${rawDataTab === "results" ? "btn-primary" : "btn-secondary"} btn-sm`} onClick={() => setRawDataTab("results")}>
                  Results ({Object.values(results).filter(Boolean).length} games)
                </button>
              </div>

              {rawDataTab === "summary" && (
                <div className="raw-data-box">
                  <div className="summary-grid">
                    <div className="summary-item">
                      <div className="summary-label">Players</div>
                      <div className="summary-value">{players.length}</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Results Entered</div>
                      <div className="summary-value">{Object.values(results).filter(Boolean).length} / 63</div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Champions Picked</div>
                      <div className="summary-value-list">
                        {players.filter(p => p.bracket.champ).map(p => (
                          <div key={p.name} className="summary-champ-row">
                            <span>{p.name}:</span> <span style={{ color: "#f59e0b" }}>({p.bracket.champ.seed}) {p.bracket.champ.team}</span>
                          </div>
                        ))}
                        {players.filter(p => p.bracket.champ).length === 0 && <span style={{ color: "#6b7280" }}>None yet</span>}
                      </div>
                    </div>
                    <div className="summary-item">
                      <div className="summary-label">Final Four Picks</div>
                      <div className="summary-value-list">
                        {players.map(p => {
                          const ff = [
                            p.bracket["east-3-0"],
                            p.bracket["south-3-0"],
                            p.bracket["west-3-0"],
                            p.bracket["midwest-3-0"]
                          ].filter(Boolean).map(t => t.team);
                          return ff.length > 0 ? (
                            <div key={p.name} className="summary-champ-row">
                              <span>{p.name}:</span> <span style={{ color: "#9ca3af" }}>{ff.join(", ")}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {rawDataTab === "players" && (
                <pre className="raw-data-box">{JSON.stringify(players.map(p => ({
                  name: p.name,
                  champion: p.bracket.champ ? `(${p.bracket.champ.seed}) ${p.bracket.champ.team}` : null,
                  totalPicks: Object.values(p.bracket).filter(Boolean).length,
                  picks: Object.fromEntries(
                    Object.entries(p.bracket).filter(([k, v]) => v).map(([k, v]) => [k, `(${v.seed}) ${v.team}`])
                  )
                })), null, 2)}</pre>
              )}

              {rawDataTab === "results" && (
                <pre className="raw-data-box">{JSON.stringify(
                  Object.fromEntries(
                    Object.entries(results).filter(([k, v]) => v).map(([k, v]) => [k, `(${v.seed}) ${v.team}`])
                  ), null, 2
                )}</pre>
              )}
            </div>

            <div className="card" style={{ marginTop: 20, borderColor: "#7f1d1d" }}>
              <h2 style={{ color: "#ef4444" }}>Danger Zone</h2>
              <p style={{ color: "#9ca3af", marginBottom: 12, fontSize: "0.9rem" }}>
                Permanently delete data. Each action requires double confirmation.
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-danger" onClick={async () => {
                  if (window.confirm("Delete ALL players and their brackets?")) {
                    if (window.confirm("Are you absolutely sure? This CANNOT be undone. All " + players.length + " player brackets will be permanently deleted.")) {
                      await supabase.from("players").delete().neq("name", "");
                      setPlayers([]);
                      showNotification("All players deleted.");
                    }
                  }
                }}>Delete All Players</button>
                <button className="btn btn-danger" onClick={async () => {
                  if (window.confirm("Delete ALL entered results?")) {
                    if (window.confirm("Are you absolutely sure? This CANNOT be undone. All game results will be permanently deleted.")) {
                      await saveResults({});
                      showNotification("All results deleted.");
                    }
                  }
                }}>Delete All Results</button>
                <button className="btn btn-danger" onClick={async () => {
                  if (window.confirm("Delete EVERYTHING? All players, brackets, AND results?")) {
                    if (window.confirm("FINAL WARNING: This will permanently erase all " + players.length + " player brackets and all results. Are you absolutely sure?")) {
                      await supabase.from("players").delete().neq("name", "");
                      setPlayers([]);
                      await saveResults({});
                      showNotification("All data deleted.");
                    }
                  }
                }}>Delete Everything</button>
              </div>
            </div>
          </>
        )}
      </div>
      <footer style={{
        textAlign: 'center',
        padding: '20px 30px',
        borderTop: '1px solid #1e293b',
        color: '#4b5563',
        fontSize: '0.75rem',
        fontFamily: "'Source Sans 3', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}>
        © 2026 Sid Yadav
        <a href="https://github.com/sidyadav3/bracket-pool" target="_blank" rel="noopener noreferrer" style={{ color: '#9ca3af', display: 'flex', transition: 'color 0.2s' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        </a>
      </footer>
    </div>
  );
}
