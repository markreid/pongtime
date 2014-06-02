module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished

    migration.addColumn('Games', 'tournamentId', {
        allowNull: true,
        type: DataTypes.INTEGER,
        references: 'Tournaments',
        referencesKey: 'id',
    }).then(function(){
        done();
    }).catch(function(err){
        throw err;
    });
  },
  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished

    migration.removeColumn('Games', 'tournamentId').then(function(){
        done();
    }).catch(function(err){
        throw err;
    });
  }
}
