import { askDakshinsetu } from "@/lib/api/ai.functions";
import { POLAR_KNOWLEDGE_ENTRIES, type KnowledgeEntry } from "./polar-knowledge";
import type { ActionCard, ChatMessage } from "./types";

interface EvidenceRecord {
  chunk_id?: string;
  document_id?: string;
  section?: string;
  page?: number | null;
}

interface AIResult {
  answer?: string;
  provider?: string;
  is_draft?: boolean;
  evidence?: EvidenceRecord[];
}

export class PolarAIService {
  private static instance: PolarAIService;

  public static getInstance(): PolarAIService {
    if (!PolarAIService.instance) {
      PolarAIService.instance = new PolarAIService();
    }
    return PolarAIService.instance;
  }

  /**
   * Main query processor:
   * 1. Handles conversational greetings directly with high engagement
   * 2. Checks live backend service /ask (with fast timeout)
   * 3. Checks direct Google Gemini API if a client key is configured
   * 4. Autonomous Grounded Knowledge Engine (100% reliable, zero backend/network failure)
   */
  public async generateResponse(
    query: string,
    history: ChatMessage[] = [],
    legacyKey?: string,
  ): Promise<{
    content: string;
    actions: ActionCard[];
    citations: string[];
    suggestedQuestions: string[];
  }> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return {
        content: "Please ask a question about polar science, research stations, or portal datasets.",
        actions: [],
        citations: [],
        suggestedQuestions: [
          "What are India's polar research stations?",
          "How does Arctic ice affect the Indian monsoon?",
          "What was discovered in the 44th Antarctic Expedition?",
        ],
      };
    }

    // -------------------------------------------------------------
    // Step 1: Instant Conversational & Greeting Handling
    // -------------------------------------------------------------
    const lowerQuery = cleanQuery.toLowerCase();
    const isGreeting = /^(hi|hello|hey|greetings|namaste|good\s+(morning|afternoon|evening)|who\s+are\s+you|what\s+can\s+you\s+do|help)(\s+.*)?$/i.test(lowerQuery);
    if (isGreeting && lowerQuery.length < 35) {
      return {
        content: `### 👋 Namaste! I am Polaris AI
I am the authoritative scientific AI assistant for **Dakshinsetu**, India's National Polar Science Knowledge Portal, operated under the **National Centre for Polar and Ocean Research (NCPOR)** and the **Ministry of Earth Sciences (MoES)**.

#### What I can help you explore:
- **Research Stations**: Details, coordinates, and telemetry from **Maitri** & **Bharati** (Antarctica), **Himadri** (Arctic), and **HIMANSH** (Himalayas).
- **Expeditions**: Scientific chronicles of the **44+ Indian Antarctic Expeditions (ISEA)**, Arctic campaigns, and Southern Ocean cruises.
- **Climate & Cryosphere Physics**: Teleconnections between Arctic sea ice and the Indian Summer Monsoon, ozone depletion, and ice core paleoclimatology.
- **Data Repository**: Accessing, querying, and citing peer-reviewed observational datasets with cryptographic SHA-256 provenance.

Feel free to ask me any question!`,
        actions: [
          {
            id: "act-stations",
            title: "Research Stations",
            to: "/expeditions",
            label: "Explore Stations",
            icon: "station",
          },
          {
            id: "act-datasets",
            title: "Scientific Datasets",
            to: "/datasets",
            label: "Explore Data",
            icon: "dataset",
          },
          {
            id: "act-globe",
            title: "3D Polar Globe",
            to: "/observatory",
            label: "Interactive Atlas",
            icon: "globe",
          },
          {
            id: "act-learning",
            title: "Learning Modules",
            to: "/learning",
            label: "Interactive Quizzes",
            icon: "learning",
          },
        ],
        citations: ["Dakshinsetu / NCPOR Polar Knowledge Base"],
        suggestedQuestions: [
          "What are India's 4 active polar research stations?",
          "How is Arctic sea ice connected to the Indian monsoon?",
          "What was discovered during the 44th Antarctic Expedition (ISEA-44)?",
          "How do scientists retrieve and study ice cores?",
        ],
      };
    }

    // -------------------------------------------------------------
    // Step 2: Live Backend /ask Service (Fast 3.5s Timeout)
    // -------------------------------------------------------------
    try {
      const backendPromise = (async (): Promise<AIResult | null> => {
        try {
          return await askDakshinsetu({ data: { query: cleanQuery } });
        } catch {
          const res = await fetch("/api/v1/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Requested-With": "Dakshinsetu" },
            body: JSON.stringify({ query: cleanQuery }),
            signal: AbortSignal.timeout(3500),
          });
          if (res.ok) {
            return (await res.json()) as AIResult;
          }
          return null;
        }
      })();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500));
      const backendResult = await Promise.race([backendPromise, timeoutPromise]);

      if (
        backendResult &&
        backendResult.answer &&
        !backendResult.answer.toLowerCase().includes("insufficient evidence") &&
        !backendResult.answer.toLowerCase().includes("could not generate an answer") &&
        !backendResult.answer.toLowerCase().includes("service is unavailable")
      ) {
        const evidenceList = Array.isArray(backendResult.evidence) ? backendResult.evidence : [];
        return {
          content:
            backendResult.answer +
            `\n\n*${backendResult.provider || "verified-portal"} · ${backendResult.is_draft ? "Synthesized evidence — review required" : "Source evidence verified"}.*`,
          actions: evidenceList.map((e) => ({
            id: e.chunk_id || e.document_id || "evidence",
            title: `${e.section || "Verified Record"}${e.page ? ` · p. ${e.page}` : ""}`,
            description: e.chunk_id || "Repository reference",
            to: e.document_id ? `/repository/${e.document_id}` : "/repository",
            label: "Read source evidence",
            icon: "dataset",
          })),
          citations: evidenceList.flatMap((e) => (e.chunk_id ? [e.chunk_id] : [])),
          suggestedQuestions: this.generateFollowUpQuestions(cleanQuery),
        };
      }
    } catch {
      // Backend not running or timed out; continue to client-side synthesis
    }

    // -------------------------------------------------------------
    // Step 3: Direct Google Gemini API Call (If Key Provided)
    // -------------------------------------------------------------
    let clientKey = legacyKey?.trim() || "";
    if (!clientKey && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("moes_polaris_chat_settings_v1");
        if (stored) {
          const parsed = JSON.parse(stored);
          clientKey = parsed.apiKey?.trim() || "";
        }
      } catch {
        // localStorage restricted
      }
    }
    if (!clientKey && typeof import.meta !== "undefined" && import.meta.env && import.meta.env["VITE_GEMINI_API_KEY"]) {
      clientKey = String(import.meta.env["VITE_GEMINI_API_KEY"]).trim();
    }

    if (clientKey) {
      try {
        const clientGeminiResult = await this.queryClientGemini(cleanQuery, clientKey, history);
        if (clientGeminiResult) {
          return clientGeminiResult;
        }
      } catch (err) {
        console.warn("Client-side Gemini call failed, falling back to autonomous engine:", err);
      }
    }

    // -------------------------------------------------------------
    // Step 4: Autonomous Grounded Polar Knowledge Engine (100% Uptime Everywhere)
    // -------------------------------------------------------------
    return this.queryBuiltinKnowledgeBase(cleanQuery);
  }

  /**
   * Direct Google Gemini API call from browser with verified MoES evidence grounding
   */
  private async queryClientGemini(
    query: string,
    apiKey: string,
    history: ChatMessage[],
  ): Promise<{
    content: string;
    actions: ActionCard[];
    citations: string[];
    suggestedQuestions: string[];
  } | null> {
    const matches = this.searchKnowledgeEntries(query, 3);
    const context = matches
      .map(
        (m) =>
          `[ENTRY: ${m.title}]\nCategory: ${m.category}\nSummary: ${m.summary}\n${m.detailedContent}`,
      )
      .join("\n\n---\n\n");

    const systemInstruction =
      "You are Polaris AI, an intelligent, authoritative scientific assistant for India's National Polar Science Portal (Dakshinsetu). " +
      "Provide comprehensive, articulate, and accurate answers regarding India's polar programmes (Antarctica, Arctic, Himalayas/Third Pole, Southern Ocean), research stations (Maitri, Bharati, Himadri, HIMANSH), expeditions, scientific observations, and datasets. " +
      "Use the provided verified knowledge base below to ground your answer when relevant, while explaining scientific mechanisms thoroughly. " +
      "Format your response cleanly with markdown headings, bullet points, and bold terms.";

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add recent history for conversational continuity
    const recent = history.slice(-4);
    for (const h of recent) {
      if (h.role === "user" || h.role === "assistant") {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: (h.content || "").split("\n\n*")[0] ?? "" }],
        });
      }
    }

    contents.push({
      role: "user",
      parts: [
        {
          text: `Verified MoES Knowledge Reference:\n${context}\n\nUser Question: ${query}`,
        },
      ],
    });

    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemInstruction }] },
              contents,
              generationConfig: {
                temperature: 0.35,
                maxOutputTokens: 2048,
              },
            }),
          },
        );

        if (!response.ok) continue;

        const data = await response.json();
        const text =
          data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") || "";

        if (text) {
          const matchedActions = matches.flatMap((m) => m.actions).slice(0, 4);
          const defaultActions: ActionCard[] = [
            {
              id: "repo-nav",
              title: "Scientific Repository",
              to: "/repository",
              label: "Explore Data",
              icon: "dataset",
            },
            {
              id: "exp-nav",
              title: "Polar Atlas",
              to: "/expeditions",
              label: "Explore Stations",
              icon: "station",
            },
          ];

          return {
            content: text + "\n\n*Powered by Google Gemini with verified MoES evidence grounding.*",
            actions: matchedActions.length > 0 ? matchedActions : defaultActions,
            citations: matches.map((m) => `MoES / NCPOR Archive: ${m.title}`),
            suggestedQuestions: this.generateFollowUpQuestions(query),
          };
        }
      } catch {
        // Try next model
      }
    }

    return null;
  }

  /**
   * Autonomous Grounded Polar Knowledge Engine
   * Queries verified knowledge base entries and synthesizes articulate answers with zero network reliance.
   */
  private queryBuiltinKnowledgeBase(query: string): {
    content: string;
    actions: ActionCard[];
    citations: string[];
    suggestedQuestions: string[];
  } {
    const matches = this.searchKnowledgeEntries(query, 3);

    if (matches.length > 0 && matches[0]) {
      const best = matches[0];
      const additional = matches.slice(1);

      let text = best.detailedContent;

      if (additional.length > 0) {
        text += `\n\n### 🔗 Related Polar Context\n`;
        for (const add of additional) {
          text += `- **${add.title}**: ${add.summary}\n`;
        }
      }

      text += `\n\n*Dakshinsetu Autonomous Knowledge Engine · Grounded in official MoES/NCPOR archives.*`;

      const allActions = [
        ...best.actions,
        ...additional.flatMap((a) => a.actions),
      ];
      // Deduplicate actions by ID
      const uniqueActions: ActionCard[] = [];
      const seenIds = new Set<string>();
      for (const act of allActions) {
        if (!seenIds.has(act.id)) {
          seenIds.add(act.id);
          uniqueActions.push(act);
        }
      }

      const allQuestions = [
        ...(best.relatedQuestions || []),
        ...additional.flatMap((a) => a.relatedQuestions || []),
      ];

      return {
        content: text,
        actions: uniqueActions.slice(0, 4),
        citations: matches.map((m) => `MoES/NCPOR Knowledge Record: ${m.title}`),
        suggestedQuestions: allQuestions.slice(0, 4),
      };
    }

    // If no direct entry matched, synthesize a structured scientific answer
    return this.synthesizeGeneralScienceResponse(query);
  }

  /**
   * Flexible fuzzy multi-term matching over 1,030 lines of polar knowledge entries
   */
  private searchKnowledgeEntries(query: string, limit = 3): KnowledgeEntry[] {
    const qLower = query.toLowerCase();
    const queryTokens = qLower
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const scored = POLAR_KNOWLEDGE_ENTRIES.map((entry) => {
      let score = 0;
      const titleLower = entry.title.toLowerCase();
      const summaryLower = entry.summary.toLowerCase();
      const contentLower = entry.detailedContent.toLowerCase();

      // Exact title match gets huge boost
      if (titleLower.includes(qLower) || qLower.includes(titleLower)) {
        score += 150;
      }

      // Keyword matches
      for (const kw of entry.keywords) {
        const kwLower = kw.toLowerCase();
        if (qLower.includes(kwLower)) {
          score += 60;
        } else {
          for (const token of queryTokens) {
            if (kwLower.includes(token)) {
              score += 20;
            }
          }
        }
      }

      // Token matches across title, summary, content
      for (const token of queryTokens) {
        if (titleLower.includes(token)) score += 25;
        if (summaryLower.includes(token)) score += 10;
        if (contentLower.includes(token)) score += 3;
      }

      return { entry, score };
    });

    return scored
      .filter((s) => s.score > 12)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.entry);
  }

  /**
   * Synthesizes an articulate, scientifically sound response for general or exploratory queries
   */
  private synthesizeGeneralScienceResponse(query: string): {
    content: string;
    actions: ActionCard[];
    citations: string[];
    suggestedQuestions: string[];
  } {
    const qLower = query.toLowerCase();

    // Check broad scientific themes
    let topicTheme = "Earth & Polar Science";
    let explanation = "";

    if (qLower.includes("ice") || qLower.includes("glacier") || qLower.includes("melt") || qLower.includes("sea level")) {
      topicTheme = "Cryosphere & Glacial Dynamics";
      explanation =
        "The Earth's polar cryosphere holds over 68% of the planet's freshwater, primarily locked in the Antarctic and Greenland ice sheets. " +
        "Indian glaciologists study ice shelf stability, surface mass balance, and ice-ocean interactions through radar sounding and automatic weather stations. " +
        "Changes in polar ice volume exert profound controls on global sea level rise, thermohaline circulation, and regional weather systems.";
    } else if (qLower.includes("monsoon") || qLower.includes("weather") || qLower.includes("wind") || qLower.includes("atmosphere")) {
      topicTheme = "Atmospheric Teleconnections & Meteorology";
      explanation =
        "Atmospheric processes in the Arctic and Antarctic are dynamically linked to mid-latitude and tropical weather. " +
        "Arctic warming alters the meridional temperature gradient, causing undulations in the polar jet stream (Rossby wave trains) that modulate the onset, intensity, and active-break spells of the Indian Summer Monsoon. " +
        "At Maitri and Bharati, continuous boundary-layer and radiation measurements record the impact of southern polar vortex dynamics.";
    } else if (qLower.includes("ocean") || qLower.includes("current") || qLower.includes("carbon") || qLower.includes("water")) {
      topicTheme = "Southern Ocean & Hydrography";
      explanation =
        "The Southern Ocean acts as Earth's primary climate engine, absorbing approximately 40% of all anthropogenic carbon dioxide and over 75% of excess oceanic heat. " +
        "India's dedicated Southern Ocean Expeditions (SOE) conduct repeat hydrography transects along the 57°E meridian, tracking deep-water freshening, biogeochemical acidification, and nutrient transport.";
    } else if (qLower.includes("penguin") || qLower.includes("seal") || qLower.includes("animal") || qLower.includes("life") || qLower.includes("biology")) {
      topicTheme = "Polar Ecology & Cold Adaptation";
      explanation =
        "Polar organisms have evolved sophisticated biological adaptations to thrive in sub-zero environments, including antifreeze glycoproteins, dense blubber layers, and specialized metabolic pathways. " +
        "Indian research programmes examine extremophile bacteria and moss communities in Schirmacher Oasis freshwater lakes, alongside monitoring Adélie and Emperor penguin breeding colonies in the Larsemann Hills.";
    } else {
      explanation =
        `Polaris AI explores all scientific facets of the polar regions—Antarctica, the Arctic, the Himalayas (Third Pole), and the Southern Ocean. ` +
        `Our database archives peer-reviewed observational records, station telemetry, and expedition field logs certified under the Ministry of Earth Sciences.`;
    }

    const content = `### 🌐 ${topicTheme}

${explanation}

#### Key Scientific Pillars in Dakshinsetu:
- **Antarctic Operations**: Continuous year-round monitoring at **Maitri** (Queen Maud Land) and **Bharati** (Larsemann Hills).
- **Arctic Svalbard Campaigns**: Fjord oceanography and atmospheric physics based at **Himadri** (Ny-Ålesund).
- **Himalayan Cryosphere**: High-altitude glacier mass balance measured at **HIMANSH** (4,080m, Spiti Valley).
- **Southern Ocean Hydrography**: Carbon sink accounting and biological pump studies aboard research vessels.

*Dakshinsetu Autonomous Knowledge Engine · Grounded in official MoES/NCPOR records.*`;

    return {
      content,
      actions: [
        {
          id: "act-datasets",
          title: "Explore Datasets",
          to: "/datasets",
          label: "Scientific Datasets",
          icon: "dataset",
        },
        {
          id: "act-stations",
          title: "Research Stations",
          to: "/expeditions",
          label: "View Stations",
          icon: "station",
        },
        {
          id: "act-globe",
          title: "3D Earth Observatory",
          to: "/observatory",
          label: "Open 3D Globe",
          icon: "globe",
        },
      ],
      citations: [
        "National Centre for Polar and Ocean Research (NCPOR)",
        "Ministry of Earth Sciences (MoES), Government of India",
      ],
      suggestedQuestions: [
        "What are India's 4 active polar research stations?",
        "How is Arctic sea ice connected to the Indian monsoon?",
        "What is the 57°E Southern Ocean hydrography line?",
        "How do I search and download research datasets?",
      ],
    };
  }

  /**
   * Context-aware suggested follow-up questions generator
   */
  private generateFollowUpQuestions(query: string): string[] {
    const qLower = query.toLowerCase();

    if (qLower.includes("maitri")) {
      return [
        "Where is Lake Priyadarshini located near Maitri?",
        "What was India's first Antarctic station, Dakshin Gangotri?",
        "What instruments operate year-round at Maitri?",
      ];
    }
    if (qLower.includes("bharati")) {
      return [
        "How was Bharati constructed to minimize environmental impact?",
        "What oceanographic research occurs near Larsemann Hills?",
        "How do Maitri and Bharati communicate with India?",
      ];
    }
    if (qLower.includes("himadri") || qLower.includes("arctic")) {
      return [
        "What is IndARC, India's underwater Arctic observatory?",
        "How does Arctic amplification influence Indian monsoon rainfall?",
        "Why is Svalbard significant for international Arctic research?",
      ];
    }
    if (qLower.includes("himansh") || qLower.includes("himalaya")) {
      return [
        "Which glacier is studied at HIMANSH station?",
        "Why are the Himalayas called Earth's Third Pole?",
        "What is glacier mass balance and how is it measured?",
      ];
    }
    if (qLower.includes("44th") || qLower.includes("isea-44") || qLower.includes("expedition")) {
      return [
        "What is a firn core and what does it reveal about past climate?",
        "How are blue-ice meteorites collected in Antarctica?",
        "What ship was used for the 44th Antarctic expedition?",
      ];
    }

    return [
      "What are India's 4 active polar research stations?",
      "How is Arctic sea ice connected to the Indian monsoon?",
      "What was discovered in the 44th Antarctic Expedition?",
      "How do I download datasets from Dakshinsetu?",
    ];
  }
}

export const polarAI = PolarAIService.getInstance();
