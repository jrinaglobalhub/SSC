import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image
} from "react-native";
import { Sparkles, Send, X, Bot, User } from "lucide-react-native";
import { useApp } from "../context/AppContext";
import { askShopperAI } from "../api/gemini";

interface Message {
  sender: "user" | "ai";
  text: string;
}

const QUICK_PROMPTS = [
  "ഏറ്റവും മികച്ച ബിരിയാണി ഓഫർ എവിടെയുണ്ട്?",
  "Grocery discounts near me",
  "Top 50% OFF deals today",
  "Electronics and mobile offers"
];

export const AiAssistantModal: React.FC = () => {
  const { showAiAssistant, setShowAiAssistant, offers } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "ai",
      text: "ഹലോ! ഞാൻ SmartShopper AI. നിങ്ങളുടെ അടുത്തുള്ള ഏറ്റവും മികച്ച ഓഫറുകളും കിഴിവുകളും കണ്ടെത്താൻ എന്നോട് ചോദിക്കാം!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  if (!showAiAssistant) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: Message = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const answer = await askShopperAI(textToSend, offers);
      setMessages((prev) => [...prev, { sender: "ai", text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "ക്ഷമിക്കണം, കണക്ഷൻ തകരാർ കാരണം മറുപടി നൽകാൻ സാധിച്ചില്ല." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={showAiAssistant}
      animationType="slide"
      onRequestClose={() => setShowAiAssistant(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Image
              source={require("../../assets/icon-192.png")}
              style={{ width: 32, height: 32, borderRadius: 8 }}
              resizeMode="contain"
            />
            <View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#F97316" }}>Smart</Text>
                <Text style={{ fontSize: 16, fontWeight: "900", color: "#0F172A" }}>Shopper AI</Text>
              </View>
              <Text style={styles.subtitle}>SmartShopper • Live Deal Radar</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setShowAiAssistant(false)}
          >
            <X size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView style={styles.messageList} contentContainerStyle={{ padding: 16, gap: 12 }}>
          {messages.map((m, idx) => (
            <View
              key={idx}
              style={[
                styles.messageBubble,
                m.sender === "user" ? styles.userBubble : styles.aiBubble
              ]}
            >
              <View style={styles.senderHeader}>
                {m.sender === "ai" ? (
                  <Sparkles size={14} color="#EA580C" />
                ) : (
                  <User size={14} color="#2563EB" />
                )}
                <Text style={styles.senderName}>
                  {m.sender === "ai" ? "SmartShopper AI" : "You"}
                </Text>
              </View>
              <Text style={styles.messageText}>{m.text}</Text>
            </View>
          ))}

          {loading && (
            <View style={[styles.messageBubble, styles.aiBubble]}>
              <ActivityIndicator size="small" color="#EA580C" />
            </View>
          )}
        </ScrollView>

        {/* Quick Prompts */}
        <View style={styles.promptsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {QUICK_PROMPTS.map((p, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.promptChip}
                onPress={() => handleSend(p)}
              >
                <Text style={styles.promptText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ask about local deals & stores..."
            placeholderTextColor="#94A3B8"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            disabled={!input.trim() || loading}
            onPress={() => handleSend()}
          >
            <Send size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  subtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1
  },
  closeBtn: {
    padding: 6
  },
  messageList: {
    flex: 1
  },
  messageBubble: {
    padding: 12,
    borderRadius: 14,
    maxWidth: "85%"
  },
  aiBubble: {
    backgroundColor: "#FFF7ED",
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#FED7AA"
  },
  userBubble: {
    backgroundColor: "#EFF6FF",
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#BFDBFE"
  },
  senderHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 4
  },
  senderName: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B"
  },
  messageText: {
    fontSize: 13,
    color: "#1E293B",
    lineHeight: 18
  },
  promptsContainer: {
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9"
  },
  promptChip: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  promptText: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "700"
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    gap: 8
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: "#F1F5F9",
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 13,
    color: "#0F172A"
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EA580C",
    alignItems: "center",
    justifyContent: "center"
  },
  sendBtnDisabled: {
    backgroundColor: "#CBD5E1"
  }
});
