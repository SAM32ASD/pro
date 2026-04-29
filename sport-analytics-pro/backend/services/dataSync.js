const apiSports = require('./apiSports');
const db = require('../config/database');

class DataSyncService {
  async syncDailyData() {
    console.log('🔄 Synchronisation quotidienne démarrée...');
    
    try {
      await this.syncTodayMatches();
      await this.updateEloRatings();
      console.log('✅ Synchronisation terminée');
    } catch (error) {
      console.error('❌ Erreur sync:', error);
    }
  }

  async syncTodayMatches() {
    console.log('📅 Sync des matchs du jour...');
  }

  async updateEloRatings() {
    console.log('⭐ Mise à jour Elo ratings...');
  }
}

module.exports = new DataSyncService();
