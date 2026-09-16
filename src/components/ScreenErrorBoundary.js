/**
 * Catch render crashes so a failed home screen does not become a blank white page.
 */
import { Component } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default class ScreenErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[onboarding] HomeScreen crashed', error, info);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const colors = this.props.colors || {
      background: '#EEF0F4',
      danger: '#BE123C',
      dangerSoft: '#FFE4E6',
      accent: '#6D28D9',
      text: '#14101F',
    };

    return (
      <View style={[styles.wrap, { backgroundColor: colors.background }]}>
        <View style={[styles.errorBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {this.state.error.message || 'Something went wrong after saving your name.'}
          </Text>
          <Pressable
            onPress={() => {
              this.setState({ error: null });
              this.props.onRetry?.();
            }}>
            <Text style={[styles.errorRetry, { color: colors.accent }]}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  errorRetry: {
    fontSize: 14,
    fontWeight: '800',
  },
});
