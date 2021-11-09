import Command from '../lib/structures/Command';

export default new Command('unsubscribe', async (caller, cmd, log) => {
	if (!log!.subscriptions.includes(cmd.msg.author.id))
		return caller.utils.discord.createMessage(cmd.channel.id, 'No estás suscrito a este hilo.');
	const updated = await caller.db.updateLog(log!._id, 'subscriptions', cmd.msg.author.id, 'PULL');
	if (updated)
		return caller.utils.discord.createMessage(cmd.channel.id, 'No recibirás más notificaciones sobre nuevas respuestas.');
	if (!updated)
		return caller.utils.discord.createMessage(cmd.channel.id, 'Hubo un error al cancelar tu suscripción a este hilo.');
},
{
	level: 'SUPPORT',
	threadOnly: true,
	aliases: []
});
