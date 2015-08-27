Tasks=new Mongo.Collection('tasks');

if (Meteor.isClient) {
    
    Meteor.subscribe('tasks');
    
    Template.body.helpers({
        tasks:function(){
            if(Session.get('hideCompleted')){
                return Tasks.find({checked:{$ne:true}},{sort:{createAt:-1}});
            }else{
                
                return Tasks.find({},{sort:{createAt:-1}});
            }
            
        },
        hideCompleted:Session.get('hideCompleted'),
        incompleteCount: function(){
            return Tasks.find({checked:{$ne:true}}).count();
        }
        /*[
            {text:'This is task 1'},
            {text:'This is task 2'},
            {text:'This is task 3'},
            {text:'This is task 4'},
        ]*/
    });
    
    Template.body.events({
        'submit .new-task':function(event){
            event.preventDefault();
            
            var text=event.target.text.value;
            
            Meteor.call('addTask',text);
            
            event.target.text.value='';
        },
        'change .hide-completed input':function(event,template){
            Session.set("hideCompleted",event.target.checked);
        }
    });
    
    
    Template.task.helpers({
        isOwner: function(){
            return this.owner === Meteor.userId();
        }
    });
    
    Template.task.events({
        'click .toggle-checked':function(event,template){
            //Tasks.update(this._id,{$set:{checked:!this.checked}});
            Meteor.call('setChecked',this._id, !this.checked);
        },
        'click .delete':function(event,template){
            //Tasks.remove(this._id);
            Meteor.call("deleteTask",this._id);
        },
        'click .toggle-private':function(){
            Meteor.call("setPrivate",this._id, !this.private);
        }
    });
    
    
    Accounts.ui.config ({
        passwordSignupFields: "USERNAME_ONLY"
    });
    
    

 
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
    
    Meteor.publish("tasks",function(){
      /*  if(Session.get('hideCompleted')){
                return Tasks.find({checked:{$ne:true}},{sort:{createAt:-1}});
            }else{
             */   
                return Tasks.find({
                    $or:[
                        {private: {$ne:true}},
                        {owner: this.userId}
                    ]
                },{sort:{createAt:-1}});
           // }
    });
    
    Meteor.methods({
        addTask:function(text){
            if(!Meteor.userId()){
                throw new Meteor.Error("not-authorized");
            }
            Tasks.insert({
                text:text,
                owner:Meteor.userId(),
                userName:Meteor.user().username,
                createAt: new Date()
            });
            
        },
        
        deleteTask:function(taskId){
            var task=Tasks.findOne(taskId);
            if(task.private && task.owner !== Meteor.userId()){
                throw new Meteor.Error('not-authorized');
            }
            Tasks.remove(taskId);
        },
        
        setChecked:function(taskId, setChecked ){
            var task=Tasks.findOne(taskId);
            if(task.private && task.owner !== Meteor.userId()){
                throw new Meteor.Error('not-authorized');
            }
            Tasks.update(taskId,{$set:{checked:setChecked }});   
        },
        
        setPrivate: function(taskId, setPrivate){
            var task=Tasks.findOne(taskId);
            if(task.owner !== Meteor.userId()){
                throw new Meteor.Error('not-authornized');
            }
            Tasks.update(taskId,{$set:{private:setPrivate }});  
        }
    });
}
