/**
 * Notifications service
 *
 * A little pubsub system for sending messages around the place.
 */

(function(){
    'use strict';

    angular.module('pong').factory('notifications', ['$http', function($http){

        var notificationTypes = ['messages'];

        var NotificationsService = function(){
            var listeners = this.listeners = {};
            _.each(notificationTypes, function(type){
                listeners[type] = [];
            });
        };

        NotificationsService.prototype.subscribe = function(type, callback){
            if(!this.listeners[type]) throw new Error(type + ' is not a valid notificationType');
            this.listeners[type].push(callback);
        };

        NotificationsService.prototype.publish = function(type, data){
            // always send an array.
            if(!(data instanceof Array)) data = [data];

            _.each(this.listeners[type], function(callback){
                callback(data);
            });
        };


        // and some shortcut methods

        // respond to a 403
        NotificationsService.prototype.unauthorised = function(){
            this.publish('messages', {
                class: 'alert-danger',
                text: 'Whoa there, buddy. You\'re not allowed to do that.'
            });
        };

        NotificationsService.prototype.generic = function(){
            this.publish('messages', {
                class: 'alert-warning',
                text: 'Sheeeeeit. Can\'t get a response from the server. Try again.'
            });
        };

        return new NotificationsService();

    }]);

})();
