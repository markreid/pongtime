module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished

    migration.changeColumn('Games', 'leagueId', {
        type: DataTypes.INTEGER,
        references: 'Leagues',
        referencesKey: 'id',
        allowNull: false
    }).then(function(){
        return migration.changeColumn('Players', 'leagueId', {
            type: DataTypes.INTEGER,
            references: 'Leagues',
            referencesKey: 'id',
            allowNull: false
        });
    }).then(function(){
        return migration.changeColumn('Teams', 'leagueId', {
            type: DataTypes.INTEGER,
            references: 'Leagues',
            referencesKey: 'id',
            allowNull: false
        });
    }).then(function(){
        done();
    }).catch(function(err){
        throw err;
    });
  },
  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.changeColumn('Games', 'leagueId', {
        type: DataTypes.INTEGER,
        references: 'Leagues',
        referencesKey: 'id',
        //allowNull: false
    }).then(function(){
        return migration.changeColumn('Players', 'leagueId', {
            type: DataTypes.INTEGER,
            references: 'Leagues',
            referencesKey: 'id',
            //allowNull: false
        });
    }).then(function(){
        return migration.changeColumn('Teams', 'leagueId', {
            type: DataTypes.INTEGER,
            references: 'Leagues',
            referencesKey: 'id',
            //allowNull: false
        });
    }).then(function(){
        done();
    }).catch(function(err){
        throw err;
    });
  }
}
