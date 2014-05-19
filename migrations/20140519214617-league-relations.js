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
        allowNull: false
    }).success(function(){
        migration.addColumn('Players', 'leagueId', {
            type: DataTypes.INTEGER,
            references: 'Leagues',
            referencesKey: 'id',
            allowNull: false
        }).success(function(){
            migration.addColumn('Teams', 'leagueId', {
                type: DataTypes.INTEGER,
                references: 'Leagues',
                referencesKey: 'id',
                allowNull: false
            }).success(function(){
                done();
            });
        });
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
