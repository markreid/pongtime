/**
 * Add all the relational columns for Leagues
 */

module.exports = {
  up: function(migration, DataTypes, done) {
    // add altering commands here, calling 'done' when finished

    migration.addColumn('Games', 'leagueId', {
        type: DataTypes.INTEGER,
        references: 'Leagues',
        referencesKey: 'id',
        allowNull: false,
        default: 1
    }).then(function(){
        // now remove the default
        return migration.changeColumn('Games', 'leagueId', {
            type: DataTypes.INTEGER,
            references: 'Leagues',
            referencesKey: 'id',
            allowNull: false
        });
    }).then(function(){
        return migration.addColumn('Players', 'leagueId', {
            type: DataTypes.INTEGER,
            references: 'Leagues',
            referencesKey: 'id',
            allowNull: false,
            default: 1
        });
    }).then(function(){
        // now remove the default
        return migration.changeColumn('Players', 'leagueId', {
            type: DataTypes.INTEGER,
            references: 'Leagues',
            referencesKey: 'id',
            allowNull: false
        });
    }).then(function(){
        return migration.addColumn('Teams', 'leagueId', {
            type: DataTypes.INTEGER,
            references: 'Leagues',
            referencesKey: 'id',
            allowNull: false,
            default: 1
        });
    }).then(function(){
        return migration.changeColumn('Teams', 'leagueId', {
            type: DataTypes.INTEGER,
            references: 'Leagues',
            referencesKey: 'id',
            allowNull: false
        };
    }).then(function(){
        done();
    }).catch(function(err){
        throw err;
    });

  },
  down: function(migration, DataTypes, done) {
    // add reverting commands here, calling 'done' when finished
    migration.removeColumn('Games', 'leagueId').success(function(){
        migration.removeColumn('Players', 'leagueId').success(function(){
            migration.removeColumn('Teams', 'leagueId').success(function(){
                done();
            });
        });
    });
  }
}
