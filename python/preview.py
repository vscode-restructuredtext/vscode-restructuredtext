from docutils import core, writers

class HTML4Body(writers.get_writer_class("html"), object):
    def translate(self):
        super(HTML4Body, self).translate()
        self.output = ''.join(self.html_body)

pub = core.Publisher()
pub.writer = HTML4Body()
pub.set_components('standalone', 'restructuredtext', 'htmlbody')
pub.publish(None,
    '%prog [options] [<source> [<destination>]]',
    'Reads from source (:stdin) and writes to destination (:stdout). ')