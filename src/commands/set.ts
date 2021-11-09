import Command from '../lib/structures/Command';
import Axios from 'axios';
import MessageEmbed from '../lib/structures/MessageEmbed';
import { COLORS, STATUSES } from '../Constants';
import { AnyChannel, TextChannel } from 'eris';
import ms from 'ms';
import {IConfig} from "../lib/types/Database";

export default new Command('set', async (caller, cmd, _log, config) => {
	const invalidArgsEmbed = new MessageEmbed()
		.setTitle('Configuración que puede cambiar del bot.')
		.setColor(COLORS.GREEN)
		.setThumbnail(cmd.channel.guild.dynamicIconURL())
		.setDescription(`
\`avatar\`: attach an image to change the bot avatar.
\`username\`: change the bot username, not the nickname.
\`prefix\`: change the bot prefix (max length: 4).
\`category\`: send the ID of the category where you want new threads to open.
\`logs\`: send the ID of the channel where you want your logs to go to.
\`status\`: change the displayed status of your bot.
\`status_type\`: change the displayed status type of your bot.
\`notification\`: send the role ID you want to be mentioned on thread creation.
\`account_age\`: the age an account needs to have in order to open a new thread.
\`guild_age\`: the time an account needs to have been inside the server in order to open a new thread.
\`guild_age_id\`: the server ID where someone needs to have the required **guild_age**.
\`embed_creation_title\`: the title of the embed sent to the user when the thread is opened.
\`embed_creation_thumbnail\`: the thumbnail of the embed sent to the user when the thread is opened ("none" to disable).
\`embed_creation_description\`: the description of the embed sent to the user when the thread is opened.
\`embed_creation_color\`: the color (hex code) of the embed sent to the user when the thread is opened.
\`embed_creation_footer_text\`: the footer of the embed sent to the user when the thread is opened.
\`embed_creation_footer_image\`: the footer image of the embed sent to the user when the thread is opened.
\`embed_contact_title\`: the title of the embed sent to the user when the thread is created by a staff member.
\`embed_contact_thumbnail\`: the thumbnail of the embed sent to the user when the thread is created by a staff member ("none" to disable).
\`embed_contact_description\`: the description of the embed sent to the user when the thread is created by a staff member.
\`embed_contact_color\`: the color (hex code) of the embed sent to the user when the thread is created by a staff member.
\`embed_contact_footer_text\`: the footer of the embed sent to the user when the thread is created by a staff member.
\`embed_contact_footer_image\`: the footer image of the embed sent to the user when the thread is created by a staff member.
\`embed_closure_title\`: the title of the embed sent to the user when the thread is closed.
\`embed_closure_thumbnail\`: the thumbnail of the embed sent to the user when the thread is closed ("none" to disable).
\`embed_closure_description\`: the description of the embed sent to the user when the thread is closed.
\`embed_closure_color\`: the color (hex code) of the embed sent to the user when the thread is closed.
\`embed_closure_footer_text\`: the footer of the embed sent to the user when the thread is closed.
\`embed_closure_footer_image\`: the footer image of the embed sent to the user when the thread is closed.
\`embed_staff_title\`: the title of the embed sent to the staff when the thread is opened.
\`embed_staff_color\`: the color (hex code) of the embed sent to the staff when the thread is opened.`)
		.addField('Usage', `${config.prefix}set {parameter} {value}`);

	if (!cmd.args[0]) return caller.utils.discord.createMessage(cmd.channel.id, { embed: invalidArgsEmbed.code });
	if (!cmd.args[1] && cmd.msg.attachments.length === 0) return caller.utils.discord.createMessage(cmd.channel.id, 'Please, provide a value.');

	let updated: boolean;
	switch (cmd.args[0]) {
		case 'avatar':
			if (!cmd.msg.attachments[0])
				return caller.utils.discord.createMessage(cmd.channel.id, 'You have to attach an image to the message.');
			Axios.get<Buffer>(cmd.msg.attachments[0].url, { responseType: 'arraybuffer' }).then(response => {
				caller.bot.editSelf({ avatar: `data:image/${cmd.msg.attachments[0].filename.endsWith('png') ? 'png' : 'jpeg'};base64,${response.data.toString('base64')}` })
					.catch((err) => {
						caller.utils.discord.createMessage(cmd.channel.id, 'Avatar could not be edited.');
						console.log(err);
					});
			})
				.catch((err) => {
					caller.utils.discord.createMessage(cmd.channel.id, 'Avatar could not be edited.');
					console.log(err);
				});
			caller.utils.discord.createMessage(cmd.channel.id, 'Avatar edited.');
			break;

		case 'username': case 'name':
			caller.bot.editSelf({ username: cmd.args.slice(1).join(' ') }).catch(() => {
				return caller.utils.discord.createMessage(cmd.channel.id, 'Something went wrong.');
			} );
			caller.utils.discord.createMessage(cmd.channel.id, 'Username edited.');
			break;

		case 'prefix':
			if (cmd.args[1].length > 4)
				return caller.utils.discord.createMessage(cmd.channel.id, 'El prefijo no puede tener más de 4 caracteres.');
			updated = await caller.db.updateConfig('prefix', cmd.args[1]);
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se ha cambiado el prefijo.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el prefijo.');
			break;

		case 'category':
			// eslint-disable-next-line no-case-declarations
			const categoryChannel = caller.bot.getChannel(cmd.args[1]);
			if (!categoryChannel || categoryChannel.type !== 4 || categoryChannel.guild.id !== process.env.MAIN_GUILD_ID)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Tienes que seleccionar un canal válido dentro del servidor principal.');


			updated = await caller.db.updateConfig('mainCategoryID', cmd.args[1]);
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se ha cambiado la categoría donde se crean los tickets.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar la categoría.');
			break;

		case 'logs':
			// eslint-disable-next-line no-case-declarations
			let logsChannel: AnyChannel;
			if (cmd.args[1] !== 'none') {
				logsChannel = cmd.msg.channelMentions[0] ? caller.bot.getChannel(cmd.msg.channelMentions[0]) || caller.bot.getChannel(cmd.args[1]) : caller.bot.getChannel(cmd.args[1]);
				if (!logsChannel || logsChannel.type !== 0)
					return caller.utils.discord.createMessage(cmd.channel.id, 'Tienes que seleccionar un canal válido.');
			}

			updated = await caller.db.updateConfig('logsChannelID', cmd.args[1] === 'none' ? '' : (logsChannel! as TextChannel).id, cmd.args[1] === 'none' ? 'UNSET' : 'SET');
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se ha cambiado el canal al que se envían los registros.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el canal de registro.');
			break;

		case 'status':
			updated = await caller.db.updateConfig('status', cmd.args.slice(1).join(' '));
			if (updated) {
				caller.bot.editStatus('online', {
					name: cmd.args.slice(1).join(' '),
					type: 0
				});
				return caller.utils.discord.createMessage(cmd.channel.id, 'El estado ha cambiado.');
			}
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el estado.');
			break;

		case 'status_type':
			// eslint-disable-next-line no-case-declarations
			const type = STATUSES[cmd.args[1].toUpperCase() as keyof typeof STATUSES];
			if (!type || typeof type !== 'number')
				return caller.utils.discord.createMessage(cmd.channel.id, 'Please, provide a valid type: `playing`, `streaming`, `listening`, `watching` or `competing`.');

			if (type === 1 && (!cmd.args[2] || !cmd.args[2].match(/https:\/\/(www\.)?twitch\.tv\/.+|https:\/\/(www\.)?youtube\.com\/.+/g)))
				return caller.utils.discord.createMessage(cmd.channel.id, 'Please, provide a Twitch or YouTube URL.');

			updated = await caller.db.updateConfig('statusType', type);
			if (updated) {
				const config = await caller.db.getConfig() as IConfig;
				caller.bot.editStatus('online', {
					name: config.status,
					// @ts-ignore
					type: type,
					url: type === 1 ? cmd.args[2] : undefined
				});

				if (type === 1)
					caller.db.updateConfig('statusURL', cmd.args[2]);

				return caller.utils.discord.createMessage(cmd.channel.id, 'The status type has been changed.');
			}
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'The status could not be updated.');
			break;

		case 'account_age':
			if (cmd.args[1] !== '0' && !cmd.args[1].match(/^[0-9]+(\.\d{1,2})?[m|h|d|w|y]$/))
				return caller.utils.discord.createMessage(cmd.channel.id, 'You have to select a valid format. For example, 1d = 1 day / 30m = 30 minutes. To disable it, just type `0`.\nValid letters: m / h / d / w / y');
			// eslint-disable-next-line no-case-declarations
			const accountAge = ms(cmd.args[1]);
			if ((!accountAge && cmd.args[1] !== '0') || accountAge > 315569520000)
				return caller.utils.discord.createMessage(cmd.channel.id, 'You have to select a valid format, lower than 10 years. For example, 1d = 1 day / 30m = 30 minutes. To disable it, just type `0`.');
			updated = await caller.db.updateConfig('accountAge', cmd.args[1] === '0' ? 0 : accountAge, cmd.args[1] === '0' ? 'UNSET' : 'SET');
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'The account age restriction has been changed.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'The account age restriction could not be updated.');
			break;

		case 'guild_age':
			if (cmd.args[1] !== '0' && !cmd.args[1].match(/^[0-9]+(\.\d{1,2})?[m|h|d|w|y]$/))
				return caller.utils.discord.createMessage(cmd.channel.id, 'You have to select a valid format. For example, 1d = 1 day / 30m = 30 minutes. To disable it, just type `0`.\nValid letters: m / h / d / w / y');
			// eslint-disable-next-line no-case-declarations
			const guildAge = ms(cmd.args[1]);
			if ((!guildAge && cmd.args[1] !== '0') || guildAge > 315569520000)
				return caller.utils.discord.createMessage(cmd.channel.id, 'You have to select a valid format, lower than 10 years. For example, 1d = 1 day / 30m = 30 minutes. To disable it, just type `0`.');
			updated = await caller.db.updateConfig('guildAge', cmd.args[1] === '0' ? 0 : guildAge, cmd.args[1] === '0' ? 'UNSET' : 'SET');
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'The guild age restriction has been changed.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'The guild age restriction could not be updated.');
			break;

		case 'guild_age_id':
			// eslint-disable-next-line no-case-declarations
			const guild = caller.bot.guilds.get(cmd.args[1]);
			if (!guild)
				return caller.utils.discord.createMessage(cmd.channel.id, 'I am not in that server, please select one in which i am in.');
			updated = await caller.db.updateConfig('guildAgeID', guild.id);
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'The guild age ID has been changed.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'The guild age ID could not be updated.');
			break;

		case 'notification':
			updated = await caller.db.updateConfig('notificationRole', cmd.args[1] === 'none' ? '' : cmd.msg.roleMentions[0] || cmd.args[1], cmd.args[1] === 'none' ? 'UNSET' : 'SET');
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'The notification role has been updated.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'The notification role could not be updated.');
			break;

		case 'embed_creation_title':
			updated = await caller.db.updateConfig('embeds.creation.title', cmd.args.slice(1).join(' '));
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se actualizó el título de inserción de la creación.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el título de inserción de la creación.');
			break;

		case 'embed_creation_thumbnail':
			updated = await caller.db.updateConfig('embeds.creation.thumbnail', cmd.args[1] === 'none' ? '' : cmd.args[1], cmd.args[1] === 'none' ? 'UNSET' : 'SET');
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Creación incrustar miniatura actualizado.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar la miniatura insertada de creación.');
			break;

		case 'embed_creation_description':
			updated = await caller.db.updateConfig('embeds.creation.description', cmd.args.slice(1).join(' '));
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se actualizó la descripción de la inserción de la creación.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar la descripción de inserción de creación.');
			break;

		case 'embed_creation_color':
			if (!(/^#[0-9A-F]{6}$/i.test(cmd.args[1])))
				return caller.utils.discord.createMessage(cmd.channel.id, 'Debes proporcionar un color hexadecimal válido.');

			updated = await caller.db.updateConfig('embeds.creation.color', cmd.args[1]);
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se actualizó el color de inserción de la creación.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el color de inserción de creación.');
			break;

		case 'embed_creation_footer_text':
			updated = await caller.db.updateConfig('embeds.creation.footer', cmd.args.slice(1).join(' '));
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Pie de página de inserción de creación actualizado.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el pie de página para insertar de creación.');
			break;

		case 'embed_creation_footer_image':
			if (!(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\\+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/gm.test(cmd.args[1])) && cmd.args[1] !== 'none')
				return caller.utils.discord.createMessage(cmd.channel.id, 'Debes proporcionar un enlace válido.');

			updated = await caller.db.updateConfig('embeds.creation.footerImageURL', cmd.args[1] === 'none' ? '' : cmd.args[1], cmd.args[1] === 'none' ? 'UNSET' : 'SET');
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se actualizó la imagen de pie de página de inserción de creación.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar la imagen de pie de página insertada de creación.');
			break;

		case 'embed_contact_title':
			updated = await caller.db.updateConfig('embeds.contact.title', cmd.args.slice(1).join(' '));
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se actualizó el título de inserción del contacto.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el título de inserción del contacto.');
			break;

		case 'embed_contact_thumbnail':
			updated = await caller.db.updateConfig('embeds.contact.thumbnail', cmd.args[1] === 'none' ? '' : cmd.args[1], cmd.args[1] === 'none' ? 'UNSET' : 'SET');
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se actualizó la miniatura de inserción de contacto.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar la miniatura de inserción del contacto.');
			break;

		case 'embed_contact_description':
			updated = await caller.db.updateConfig('embeds.contact.description', cmd.args.slice(1).join(' '));
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se actualizó la descripción de inserción de contacto.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar la descripción de inserción del contacto.');
			break;

		case 'embed_contact_color':
			if (!(/^#[0-9A-F]{6}$/i.test(cmd.args[1])))
				return caller.utils.discord.createMessage(cmd.channel.id, 'Debes proporcionar un color hexadecimal válido.');

			updated = await caller.db.updateConfig('embeds.contact.color', cmd.args[1]);
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Color de inserción de contacto actualizado.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el color de inserción del contacto.');
			break;

		case 'embed_contact_footer_text':
			updated = await caller.db.updateConfig('embeds.contact.footer', cmd.args.slice(1).join(' '));
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Contacto para insertar pie de página actualizado.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el pie de página para insertar contactos.');
			break;

		case 'embed_contact_footer_image':
			if (!(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\\+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/gm.test(cmd.args[1])) && cmd.args[1] !== 'none')
				return caller.utils.discord.createMessage(cmd.channel.id, 'Debes proporcionar un enlace válido.');

			updated = await caller.db.updateConfig('embeds.contact.footerImageURL', cmd.args[1] === 'none' ? '' : cmd.args[1], cmd.args[1] === 'none' ? 'UNSET' : 'SET');
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se actualizó la imagen de pie de página de inserción de contacto.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar la imagen del pie de página para insertar el contacto.');
			break;

		case 'embed_closure_title':
			updated = await caller.db.updateConfig('embeds.closure.title', cmd.args.slice(1).join(' '));
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se actualizó el título de inserción de cierre.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el título de inserción de cierre.');
			break;

		case 'embed_closure_thumbnail':
			updated = await caller.db.updateConfig('embeds.closure.thumbnail', cmd.args[1] === 'none' ? '' : cmd.args[1], cmd.args[1] === 'none' ? 'UNSET' : 'SET');
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Cierre incrustar miniatura actualizado.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar la miniatura de inserción de cierre.');
			break;

		case 'embed_closure_description':
			updated = await caller.db.updateConfig('embeds.closure.description', cmd.args.slice(1).join(' '));
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se actualizó la descripción de inserción del cierre.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar la descripción de inserción del cierre.');
			break;

		case 'embed_closure_color':
			if (!(/^#[0-9A-F]{6}$/i.test(cmd.args[1])))
				return caller.utils.discord.createMessage(cmd.channel.id, 'Debes proporcionar un color hexadecimal válido.');

			updated = await caller.db.updateConfig('embeds.closure.color', cmd.args[1]);
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Color de incrustación de cierre actualizado.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el color de inserción del cierre.');
			break;

		case 'embed_closure_footer_text':
			updated = await caller.db.updateConfig('embeds.closure.footer', cmd.args.slice(1).join(' '));
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Pie de página de inserción de cierre actualizado.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el pie de página de inserción de cierre.');
			break;

		case 'embed_closure_footer_image':
			if (!(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\\+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w\-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/gm.test(cmd.args[1])) && cmd.args[1] !== 'none')
				return caller.utils.discord.createMessage(cmd.channel.id, 'Debes proporcionar un enlace válido.');

			updated = await caller.db.updateConfig('embeds.closure.footerImageURL', cmd.args[1] === 'none' ? '' : cmd.args[1], cmd.args[1] === 'none' ? 'UNSET' : 'SET');
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se actualizó la imagen de pie de página de inserción de cierre.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar la imagen de pie de página de inserción de cierre.');
			break;

		case 'embed_staff_title':
			updated = await caller.db.updateConfig('embeds.staff.title', cmd.args.slice(1).join(' '));
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se actualizó el título de inserción del personal.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el título de inserción de personal.');
			break;

		case 'embed_staff_color':
			if (!(/^#[0-9A-F]{6}$/i.test(cmd.args[1])))
				return caller.utils.discord.createMessage(cmd.channel.id, 'Debes proporcionar un color hexadecimal válido.');

			updated = await caller.db.updateConfig('embeds.staff.color', cmd.args[1]);
			if (updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'Se actualizó el color de inserción del personal.');
			if (!updated)
				return caller.utils.discord.createMessage(cmd.channel.id, 'No se pudo actualizar el color de inserción del pentagrama.');
			break;
		default:
			caller.utils.discord.createMessage(cmd.channel.id, { embed: invalidArgsEmbed.code });
			break;
	}
},
{
	aliases: ['s']
});
